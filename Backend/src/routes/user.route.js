const router = require("express").Router();
const User = require("../models/User.model");
const bcrypt = require("bcrypt");
const authController = require("../controller/auth.user.controller");
const authMiddleware = require("../middleware/auth.middleware");
const {body, validationResult} = require('express-validator');


//REGISTER
router.post("/register",
    [
        body('username').notEmpty().withMessage('Username is required'),
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').isLength({min: 6}).withMessage('Password must be at least 6 characters long')
    ],
    authController.register);

router.post("/login", 
    [
        body('email').isEmail().withMessage('Valid email is required'),
        body('password').notEmpty().withMessage('Password is required')
    ],
    authController.login);

router.post("/logout", authMiddleware, authController.logout);

router.get("/profile", authMiddleware, authController.getProfile);

router.put("/profile", authMiddleware,
    [
        body('username').optional().notEmpty().withMessage('Username cannot be empty'),
        body('email').optional().isEmail().withMessage('Valid email is required'),
        body('password').optional().isLength({min: 6}).withMessage('Password must be at least 6 characters long')
    ],
    authController.updateProfile);
module.exports = router;