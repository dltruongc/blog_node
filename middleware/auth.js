const jwt = require("jsonwebtoken");
const config = require("../config/default.json");

/**
 *
 * @route GET /api/auth
 * @description Test route
 * @access Public
 * @param { Request } req
 * @param { Response } res
 * @param { import("express").NextFunction} next
 */
module.exports = function (req, res, next) {
    // Get token from header
    const token = req.header("x-auth-token");

    // Check if not token
    if (!token) {
        return res.status(401).json({ msg: "No token, authorization denied." });
    }

    // Verify token
    try {
        const decoded = jwt.verify(token, config.jwtSecret);

        req.user = decoded.user;
        next();
    } catch (err) {
        console.error(err.message);
        return res.status(401).json({ msg: "Token is not valid" });
    }
};
