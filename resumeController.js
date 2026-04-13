const pdf = require('pdf-parse');
const mammoth = require('mammoth');
const keyword_extractor = require('keyword-extractor');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');
const Job = require('../models/Job');
const Application = require('../models/Application');
const User = require('../models/User');

exports.analyzeResume = asyncHandler(async (req, res, next) => {
    try {
        if (!req.file) {
            return next(new ErrorResponse('Please upload a resume file (PDF or DOCX)', 400));
        }

        let jobDescriptionInput = req.body.jobDescription || '';
        const targetJobId = req.body.jobId || null;

        if (targetJobId) {
             const job = await Job.findById(targetJobId);
             if (!job) {
                 return next(new ErrorResponse('Referenced Job not found in database', 404));
             }
             // Merge description and required skills into one analyzable block
             jobDescriptionInput = job.description + ' ' + (job.requiredSkills ? job.requiredSkills.join(' ') : '');
        }
        
        if (!jobDescriptionInput) {
            return next(new ErrorResponse('Please provide a job description or valid jobId', 400));
        }

        let resumeText = '';

        // Safely determine file type and extract text
        const fileName = req.file.originalname ? req.file.originalname.toLowerCase() : '';
        const mimeType = req.file.mimetype || '';

        try {
            if (mimeType === 'application/pdf' || fileName.endsWith('.pdf')) {
                const data = await pdf(req.file.buffer);
                resumeText = data.text;
            } else if (fileName.endsWith('.docx') || mimeType.includes('wordprocessingml')) {
                const data = await mammoth.extractRawText({ buffer: req.file.buffer });
                resumeText = data.value;
            } else {
                return next(new ErrorResponse('Unsupported file format. Please upload a PDF or DOCX file.', 400));
            }
        } catch (parseError) {
             console.error('File Extraction Error:', parseError);
             return next(new ErrorResponse('Failed to extract text from the file. Ensure it is a valid PDF or DOCX.', 500));
        }

        // Clean & Tokenize Resume text
        const sanitize = (str) => str.replace(/[^a-zA-Z0-9\s#\+\-]/g, ' ').toLowerCase();
        const cleanResume = sanitize(resumeText);
        
        // 1. Dynamically extract keywords directly from the JD provided
        const extraction_result = keyword_extractor.extract(jobDescriptionInput, {
            language: "english",
            remove_digits: true,
            return_changed_case: true,
            remove_duplicates: true
        });

        // Use up to 20 dynamically extracted keywords
        const requiredKeywords = extraction_result.slice(0, 20);
        
        if (requiredKeywords.length === 0) {
            // Fallback if JD is too generic or didn't match strict words at all
            requiredKeywords.push('experience', 'communication', 'skills');
        }

        // 2. See which required keywords exist in Resume
        const matchedKeywords = requiredKeywords.filter(kw => cleanResume.includes(kw));
        const missingKeywords = requiredKeywords.filter(kw => !cleanResume.includes(kw));

        // 3. Score calculation
        // Baseline 30% for having a readable resume parsing, rest based on keywords
        let atsScore = 30; 
        
        const keywordMatchPercentage = (matchedKeywords.length / requiredKeywords.length) * 100;
        atsScore += (keywordMatchPercentage * 0.7); // Keywords contribute to 70% of remaining score

        atsScore = Math.min(Math.round(atsScore), 100);

        // 4. Generate helpful dynamic suggestions
        const suggestions = [];
        if (atsScore < 50) {
            suggestions.push('Severely lacking required keywords. Try specifically tailoring your core skill section directly to the JD.');
        }
        if (missingKeywords.length > 0) {
            suggestions.push(`Consider adding measurable experiences demonstrating: ${missingKeywords.slice(0, 3).join(', ')}.`);
        } else {
            suggestions.push('Great job matching the required technical stack!');
        }
        suggestions.push('Ensure your bullet points quantify the impact of your efforts with clear numbers (KPIs).');

        // 5. Save the Application tracking correctly directly into database!
        if (targetJobId) {
            // Find an arbitrary user to map the application temporarily if user isn't auth'ed
            const activeUser = req.user ? req.user.id : (await User.findOne())?._id;
            if (activeUser) {
                await Application.create({
                     job: targetJobId,
                     student: activeUser,
                     status: 'Applied',
                     matchPercentageAtApply: atsScore
                });
            }
        }

        res.status(200).json({
            success: true,
            data: {
                score: atsScore,
                matchedKeywords: matchedKeywords,
                missingKeywords: missingKeywords,
                suggestions: suggestions,
                resumeTextSample: resumeText.substring(0, 200) + '...' // For previewing
            }
        });

    } catch (error) {
        console.error('ATS Analysis Error:', error);
        return next(new ErrorResponse('Failed to complete ATS Analysis properly.', 500));
    }
});
