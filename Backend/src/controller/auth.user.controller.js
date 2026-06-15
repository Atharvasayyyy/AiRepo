const { validationResult } = require('express-validator');
const User = require("../model/user.model");
const bcrypt = require("bcrypt");
const jwt = require("jsonwebtoken");
const userServices = require("../services/user.services");

exports.register = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
        console.log({ error01: errors.array() });  
    }

    const { username, email, password } = req.body;
    try {
        const existingUser = await User.findOne({ email });
        if (existingUser) {
            return res.status(400).json({ message: "Email already in use" });
        }
        const existingUsername = await User.findOne({ username });
        if (existingUsername) {
            return res.status(400).json({ message: "Username already in use" });
        }
        const isBlacklisted = await userServices.isBlacklisted(email);
        if (isBlacklisted) {
            return res.status(403).json({ message: "You are blacklisted" });
        }
        const hashedPassword = await bcrypt.hash(password, 10);
        await userServices.createUser({ username, email, password: hashedPassword });
        res.status(201).json({ message: "User registered successfully",user : { username, email } });
        
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};


exports.login = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;
    console.log({ email, password });
    try {
        const user = await User.findOne({ email });
        if (!user) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: "Invalid credentials" });
        }

        if (user.isBlacklisted) {
            return res.status(403).json({ message: "You are blacklisted" });
        }
        const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, { expiresIn: "1h" });
        res.json({ message: "Login successful", token, user: { username: user.username, email: user.email } });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};

exports.logout = async (req, res) => {
    try {
        const token = req.cookies.token || req.header('Authorization')?.split(' ')[1];
        if (!token) {
            return res.status(400).json({ message: 'No token provided' });
        }

        await User.findByIdAndUpdate(req.user.id || req.user._id, { $addToSet: { blacklistedTokens: token } });
        res.status(200).json({ message: 'User logged out successfully' });
    } catch (error) {
        res.status(500).json({
            message: 'Error logging out user',
            error: error.message
        });
    }
};

exports.getProfile = async (req, res) => {
    try {
        const user = await User.findById(req.user.id || req.user._id).select('-password -blacklistedTokens');  
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        res.json(user); 
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};

exports.updateProfile = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const { username, email, password } = req.body;
    try {
        const user = await User.findById(req.user.id || req.user._id);
        if (!user) {
            return res.status(404).json({ message: 'User not found' });
        }
        if (username && username !== user.username) {
            const existingUsername = await User.findOne({ username });
            if (existingUsername) {
                return res.status(400).json({ message: 'Username already in use' });
            }
            user.username = username;
        }
        if (email && email !== user.email) {
            const existingEmail = await User.findOne({ email });
            if (existingEmail) {
                return res.status(400).json({ message: 'Email already in use' });
            }
            user.email = email;
        }
        if (password) user.password = await bcrypt.hash(password, 10);
        await user.save();
        res.json({ message: 'Profile updated successfully' });
    } catch (error) {
        res.status(500).json({ message: 'Server error' });
    }
};