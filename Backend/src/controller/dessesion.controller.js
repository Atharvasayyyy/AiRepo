const { validationResult } = require('express-validator');
const dessesionService = require('../services/dessesion.services');
const dessesionModel = require('../model/dessesion.model');
const workspaceModel = require('../model/workspace.model');

const populateMessage = [
    { path: 'sender', select: 'username email' },
    { path: 'mentions', select: 'username email' },
    { path: 'replyTo' },
    { path: 'pinnedBy', select: 'username email' }
];

async function ensureWorkspaceMember(workspaceId, userId) {
    const workspace = await workspaceModel.findById(workspaceId);

    if (!workspace) {
        const error = new Error('Workspace not found');
        error.statusCode = 404;
        throw error;
    }

    const isMember = workspace.members.some(
        member => member.user && member.user.toString() === userId.toString()
    );

    if (!isMember) {
        const error = new Error('You do not have access to this workspace');
        error.statusCode = 403;
        throw error;
    }

    return workspace;
}

exports.sendMessage = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    try {
        const message = await dessesionService.createMessage({
            content: req.body.content,
            workspace: req.params.workspaceId,
            sender: req.user._id,
            type: req.body.type || 'message',
            mentions: req.body.mentions || [],
            replyTo: req.body.replyTo || null,
            isPinned: req.body.isPinned || false,
            pinnedBy: req.body.isPinned ? req.user._id : null,
            pinnedAt: req.body.isPinned ? new Date() : null
        });

        return res.status(201).json({ success: true, message });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
};

exports.getMessages = async (req, res) => {
    try {
        await ensureWorkspaceMember(req.params.workspaceId, req.user._id);

        const messages = await dessesionModel
            .find({ workspace: req.params.workspaceId })
            .sort({ createdAt: 1 })
            .populate(populateMessage);

        return res.status(200).json({ success: true, messages });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
};

exports.deleteMessage = async (req, res) => {
    try {
        await ensureWorkspaceMember(req.params.workspaceId, req.user._id);

        const message = await dessesionModel.findOne({
            _id: req.params.messageId,
            workspace: req.params.workspaceId
        });

        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        await message.deleteOne();
        return res.status(200).json({ success: true, message: 'Message deleted successfully' });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
};

exports.pinMessage = async (req, res) => {
    try {
        await ensureWorkspaceMember(req.params.workspaceId, req.user._id);

        const message = await dessesionModel.findOne({
            _id: req.params.messageId,
            workspace: req.params.workspaceId
        });

        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        message.isPinned = true;
        message.pinnedBy = req.user._id;
        message.pinnedAt = new Date();
        await message.save();

        return res.status(200).json({ success: true, message });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
};

exports.unpinMessage = async (req, res) => {
    try {
        await ensureWorkspaceMember(req.params.workspaceId, req.user._id);

        const message = await dessesionModel.findOne({
            _id: req.params.messageId,
            workspace: req.params.workspaceId
        });

        if (!message) {
            return res.status(404).json({ success: false, message: 'Message not found' });
        }

        message.isPinned = false;
        message.pinnedBy = null;
        message.pinnedAt = null;
        await message.save();

        return res.status(200).json({ success: true, message });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
};

exports.getPinnedMessages = async (req, res) => {
    try {
        await ensureWorkspaceMember(req.params.workspaceId, req.user._id);

        const messages = await dessesionModel
            .find({ workspace: req.params.workspaceId, isPinned: true })
            .sort({ pinnedAt: -1 })
            .populate(populateMessage);

        return res.status(200).json({ success: true, messages });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
};

exports.getDecisions = async (req, res) => {
    try {
        await ensureWorkspaceMember(req.params.workspaceId, req.user._id);

        const decisions = await dessesionModel
            .find({ workspace: req.params.workspaceId, type: 'decision' })
            .sort({ createdAt: -1 })
            .populate(populateMessage);

        return res.status(200).json({ success: true, decisions });
    } catch (error) {
        return res.status(error.statusCode || 500).json({ success: false, message: error.message });
    }
};
