/**
 * Auth Controller - PIROS Recruitment Platform
 * =============================================
 * Thin controller layer. All business logic is delegated to authService.js.
 * 
 * Routes:
 *   POST /api/auth/register  → register
 *   POST /api/auth/login     → login
 *   GET  /api/auth/me        → getMe  (protected)
 */

const asyncHandler = require('../utils/asyncHandler');
const authService = require('../services/authService');

// @desc    Register a new user
// @route   POST /api/auth/register
// @access  Public
exports.register = asyncHandler(async (req, res, next) => {
    const user = await authService.registerUser(req.body);
    authService.sendTokenResponse(user, 201, res);
});

// @desc    Login with email & password
// @route   POST /api/auth/login
// @access  Public
exports.login = asyncHandler(async (req, res, next) => {
    const { email, password } = req.body;
    const user = await authService.authenticateUser(email, password);
    authService.sendTokenResponse(user, 200, res);
});

// @desc    Get current authenticated user profile
// @route   GET /api/auth/me
// @access  Private (requires JWT token in Authorization header)
exports.getMe = asyncHandler(async (req, res, next) => {
    const user = await authService.getCurrentUser(req.user.id);
    res.status(200).json({ success: true, data: user });
});
