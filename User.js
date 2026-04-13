const mongoose = require('mongoose');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');

const userSchema = new mongoose.Schema({
    name: { type: String, required: true },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [
            /^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/,
            'Please add a valid email'
        ]
    },
    password: { type: String, required: [true, 'Please add a password'], minlength: 6, select: false },
    role: { type: String, enum: ['student', 'admin', 'alumni', 'company'], default: 'student' },

    // Email + OTP Verification
    isVerified: { type: Boolean, default: false },
    otpCode: { type: String },

    // Profile features
    skills: [{ type: String }],
    cgpa: { type: Number },
    resumeUrl: { type: String },
    atsScore: { type: Number, default: 0 },

    // Leaderboard/Ranking
    testScoreTotal: { type: Number, default: 0 },
}, { timestamps: true });

// Encrypt password using bcrypt before saving
userSchema.pre('save', async function (next) {
    if (!this.isModified('password')) {
        next();
    }
    const salt = await bcrypt.genSalt(10);
    this.password = await bcrypt.hash(this.password, salt);
});

// Sign JWT and return
userSchema.methods.getSignedJwtToken = function () {
    return jwt.sign({ id: this._id, role: this.role }, process.env.JWT_SECRET || 'fail-safe-key', {
        expiresIn: '30d' // 30 Day session default
    });
};

// Match user entered password to hashed password in database
userSchema.methods.matchPassword = async function (enteredPassword) {
    return await bcrypt.compare(enteredPassword, this.password);
};

module.exports = mongoose.model('User', userSchema);
