/**
 * Auth Service - Business Logic Layer
 * 
 * Separates all authentication business logic from the controller layer.
 * The authController delegates core operations to these methods.
 * 
 * PIROS Recruitment Platform - Authentication Service
 */

const User = require('../models/User');
const ErrorResponse = require('../utils/errorResponse');
const jwt = require('jsonwebtoken');

/**
 * Register a new user
 * @param {Object} userData - { name, email, password, role }
 * @returns {Object} Created user document (without password)
 */
const registerUser = async (userData) => {
    const { name, email, password, role } = userData;

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
        throw new ErrorResponse('Email already registered. Please login instead.', 400);
    }

    // Validate role
    const allowedRoles = ['student', 'admin', 'alumni', 'company'];
    const assignedRole = allowedRoles.includes(role) ? role : 'student';

    // Create the user — password is hashed automatically via pre-save hook in User schema
    const user = await User.create({
        name,
        email,
        password,
        role: assignedRole,
        isVerified: true, // Auto-verified for prototype; use OTP in production
    });

    return user;
};

/**
 * Authenticate an existing user with email & password
 * @param {string} email 
 * @param {string} password 
 * @returns {Object} Authenticated user document (with password for comparison)
 */
const authenticateUser = async (email, password) => {
    if (!email || !password) {
        throw new ErrorResponse('Please provide both email and password.', 400);
    }

    // Explicitly select password since it has select: false in schema
    const user = await User.findOne({ email }).select('+password');

    if (!user) {
        throw new ErrorResponse('Invalid credentials. No account found with this email.', 401);
    }

    // Use the schema-level method to compare hashed passwords
    const isMatch = await user.matchPassword(password);

    if (!isMatch) {
        throw new ErrorResponse('Invalid credentials. Password mismatch.', 401);
    }

    return user;
};

/**
 * Build and return a JWT token response payload
 * @param {Object} user - Mongoose User document
 * @param {number} statusCode - HTTP status code to respond with
 * @param {Object} res - Express response object
 */
const sendTokenResponse = (user, statusCode, res) => {
    // Uses the method defined on the User schema instance
    const token = user.getSignedJwtToken();

    res.status(statusCode).json({
        success: true,
        token,
        data: {
            id: user._id,
            name: user.name,
            email: user.email,
            role: user.role,
        },
    });
};

/**
 * Verify a JWT token and return decoded payload
 * @param {string} token - JWT string
 * @returns {Object} Decoded payload { id, role }
 */
const verifyToken = (token) => {
    if (!token) {
        throw new ErrorResponse('No token provided. Access denied.', 401);
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fail-safe-key');
        return decoded;
    } catch (err) {
        throw new ErrorResponse('Invalid or expired token.', 401);
    }
};

/**
 * Fetch the currently authenticated user by their ID
 * @param {string} userId 
 * @returns {Object} User document (without password)
 */
const getCurrentUser = async (userId) => {
    const user = await User.findById(userId);
    if (!user) {
        throw new ErrorResponse('User not found.', 404);
    }
    return user;
};

module.exports = {
    registerUser,
    authenticateUser,
    sendTokenResponse,
    verifyToken,
    getCurrentUser,
};
