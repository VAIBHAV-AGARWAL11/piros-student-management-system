/**
 * Auth Protect Middleware - PIROS Recruitment Platform
 * =====================================================
 * Verifies the JWT Bearer token sent in the Authorization header.
 * Sets req.user to the decoded payload for downstream controllers.
 * 
 * Usage:
 *   const { protect } = require('../middlewares/auth');
 *   router.get('/me', protect, getMe);
 */

const jwt = require('jsonwebtoken');
const ErrorResponse = require('../utils/errorResponse');
const User = require('../models/User');
const asyncHandler = require('../utils/asyncHandler');

/**
 * Protect - Ensures the request carries a valid JWT token.
 * Attaches the authenticated user object to req.user.
 */
exports.protect = asyncHandler(async (req, res, next) => {
    let token;

    // Check Authorization header for Bearer token
    if (req.headers.authorization && req.headers.authorization.startsWith('Bearer')) {
        token = req.headers.authorization.split(' ')[1];
    }

    if (!token) {
        return next(new ErrorResponse('Not authorized to access this route. No token provided.', 401));
    }

    try {
        // Verify and decode the token
        const decoded = jwt.verify(token, process.env.JWT_SECRET || 'fail-safe-key');

        // Attach the full user document (without password) to the request
        req.user = await User.findById(decoded.id);

        if (!req.user) {
            return next(new ErrorResponse('User belonging to this token no longer exists.', 401));
        }

        next();
    } catch (err) {
        return next(new ErrorResponse('Invalid or expired token. Please log in again.', 401));
    }
});

/**
 * Authorize - Restricts access to specific roles.
 * Must be used after `protect`.
 * 
 * @param {...string} roles - Roles allowed to access the route (e.g. 'admin', 'company')
 * 
 * Example:
 *   router.delete('/job/:id', protect, authorize('admin'), deleteJob);
 */
exports.authorize = (...roles) => {
    return (req, res, next) => {
        if (!roles.includes(req.user.role)) {
            return next(
                new ErrorResponse(
                    `User role '${req.user.role}' is not authorized to access this route.`,
                    403
                )
            );
        }
        next();
    };
};
