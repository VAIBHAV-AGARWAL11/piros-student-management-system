const mongoose = require('mongoose');

const jobSchema = new mongoose.Schema({
    title: { type: String, required: true },
    company: { type: String, required: true },
    description: { type: String, required: true },
    
    salary: { type: Number },
    requiredSkills: [{ type: String }],
    
    // Geo-based job feature
    location: {
        city: String,
        country: String,
        coordinates: {
            lat: Number,
            lng: Number
        }
    },

    status: { type: String, enum: ['Open', 'Closed'], default: 'Open' },
    
    // Links to Company Rating/Review sub-schemas
    ratings: [{
        user: { type: mongoose.Schema.Types.ObjectId, ref: 'User' },
        score: { type: Number, min: 1, max: 5 },
        review: String
    }]
}, { timestamps: true });

module.exports = mongoose.model('Job', jobSchema);
