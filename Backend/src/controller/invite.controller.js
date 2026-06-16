const { validationResult } = require('express-validator');
const inviteService = require('../services/invite.services');
const userModel = require('../model/user.model');

exports.sendInvite = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const user = await userModel.findOne({ email: req.body.email });

        if (!user) {
            return res.status(404).json({ success: false, message: 'User with this email does not exist' });
        }

        if (user._id.toString() === req.user._id.toString()) {
            return res.status(400).json({ success: false, message: 'You cannot invite yourself' });
        }

        const workspace = await inviteService.createInvite({
            userId: user._id,
            role: req.body.role,
            workspaceId: req.params.workspaceId,
            senderId: req.user._id
        });

        return res.status(200).json({
            success: true,
            message: 'Member added successfully',
            workspace
        });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
};

exports.getInvites = async (req, res) => {
    try {
        const members = await inviteService.getInvites(
            req.params.workspaceId,
            req.user._id
        );

        return res.status(200).json({ success: true, members });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
};

exports.updateInvite = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const workspace = await inviteService.updateInvite(
            req.params.workspaceId,
            req.params.userId,
            req.body.role,
            req.user._id
        );

        return res.status(200).json({ success: true, workspace });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
};

exports.deleteInvite = async (req, res) => {
    try {
        await inviteService.deleteInvite(
            req.params.workspaceId,
            req.params.userId,
            req.user._id
        );

        return res.status(200).json({ success: true, message: 'Member removed successfully' });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
};
