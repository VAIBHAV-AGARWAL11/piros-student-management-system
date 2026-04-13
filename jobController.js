const Job = require('../models/Job');
const Application = require('../models/Application');
const asyncHandler = require('../utils/asyncHandler');
const ErrorResponse = require('../utils/errorResponse');

// @desc    Create a new job posting
// @route   POST /api/jobs
// @access  Public (mocked for admin)
exports.createJob = asyncHandler(async (req, res, next) => {
    const { title, company, description, requiredSkills, minCgpa } = req.body;

    if (!title || !company) {
        return next(new ErrorResponse('Please provide a title and company name', 400));
    }

    const job = await Job.create({
        title,
        company,
        description: description || `Software role at ${company}`,
        requiredSkills: requiredSkills ? requiredSkills.split(',').map(s => s.trim()) : [],
        // Added temporary parameter for UI forms matching
        salary: minCgpa ? minCgpa : 0
    });

    res.status(201).json({
        success: true,
        data: job
    });
});

// @desc    Get all active jobs
// @route   GET /api/jobs
// @access  Public
exports.getJobs = asyncHandler(async (req, res, next) => {
    const jobs = await Job.find({ status: 'Open' }).sort('-createdAt');
    res.status(200).json({
        success: true,
        count: jobs.length,
        data: jobs
    });
});

// @desc    Get all applicants for a specific job
// @route   GET /api/jobs/:id/applicants
// @access  Public (admin)
exports.getApplicants = asyncHandler(async (req, res, next) => {
    const job = await Job.findById(req.params.id);
    if (!job) {
        return next(new ErrorResponse('Job not found', 404));
    }

    const applications = await Application.find({ job: req.params.id })
        .populate('student', 'name email cgpa atsScore skills')
        .sort('-createdAt');

    res.status(200).json({
        success: true,
        jobTitle: job.title,
        company: job.company,
        count: applications.length,
        data: applications
    });
});
