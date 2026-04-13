const mongoose = require('mongoose');

const applicationSchema = new mongoose.Schema({
    job: { type: mongoose.Schema.Types.ObjectId, ref: 'Job', required: true },
    student: { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
    
    // Application Tracking System (ATS)
    status: { 
        type: String, 
        enum: ['Applied', 'Under Review', 'Interview Scheduled', 'Selected', 'Rejected'], 
        default: 'Applied' 
    },
    
    // Interview Scheduling System Feature
    interviewDate: { type: Date },
    interviewLink: { type: String },

    matchPercentageAtApply: { type: Number },
}, { timestamps: true });

module.exports = mongoose.model('Application', applicationSchema);
