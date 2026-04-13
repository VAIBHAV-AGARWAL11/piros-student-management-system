const mongoose = require('mongoose');

const testSchema = new mongoose.Schema({
    title: { type: String, required: true },
    type: { type: String, enum: ['Coding', 'Aptitude'], required: true },
    
    // Arrays for Mock questions or multiple choice
    questions: [{
        questionText: String,
        options: [String],
        correctAnswer: String,
        points: Number
    }],
    
    timeLimitMinutes: { type: Number, default: 30 }
}, { timestamps: true });

module.exports = mongoose.model('Test', testSchema);
