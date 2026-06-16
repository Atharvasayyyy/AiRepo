const dessesionService = require('../service/dessesion.service');
const dessesionmodel = require('../model/dessesion.model');
const workspaceModel = require('../models/workspace.model');
const { validationResult } = require('express-validator');

exports.sendMessage = async (req, res) => {
    const errors = validationResult(req);
    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }
    const messageData = {
        content: req.body.content,
        workspace: req.params.workspaceId,
        sender: req.user._id,
        type: req.body.type || "message",
        mentions: req.body.mentions || [],
        replyTo: req.body.replyTo || null,
        isPinned: req.body.isPinned || false,
        pinnedBy: req.body.pinnedBy || null,
        pinnedAt: req.body.pinnedAt || null
    };
    if (workspaceId !== req.params.workspaceId) {
        return res.status(403).json({ error: "You do not have access to this workspace" });
    }
    try {
        const message = await dessesionService.createMessage(messageData);
        return res.status(201).json(message);
        console.log(message);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

exports.getMessages = async (req, res) => { 
    const workspaceId = req.params.workspaceId;
    if (workspaceId !== req.params.workspaceId) {
        return res.status(403).json({ error: "You do not have access to this workspace" });
    }
    const isMember = req.user._id;
    if (!isMember) {
        return res.status(403).json({ error: "You do not have access to this workspace" });
    }
    try {
        const messages = await dessesionmodel.find({ workspace: workspaceId }).populate('sender', 'name email').populate('mentions', 'name email').populate('replyTo').populate('pinnedBy', 'name email');
        return res.status(200).json(messages);
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

exports.deleteMessage = async (req, res) => {
    const workspaceId = req.params.workspaceId;
    if (workspaceId !== req.params.workspaceId) {
        return res.status(403).json({ error: "You do not have access to this workspace" });
    }
    const isMember = req.user._id;
    if (!isMember) {
        return res.status(403).json({ error: "You do not have access to this workspace" });
    }
    try {
        const message = await dessesionmodel.findById(req.params.messageId);
        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }
        await dessesionmodel.findByIdAndDelete(req.params.messageId);
        return res.status(200).json({ message: "Message deleted successfully" });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

exports.pinMessage = async (req, res) => {
    const workspace = req.params.workspaceId;
        const existingWorkspace =
            await workspaceModel.findById(
                workspace
            );
    
        if (!existingWorkspace) {
            throw new Error(
                "Workspace not found"
            );
        }
    
        const isMember =
            existingWorkspace.members.some(
                member =>
                    member.user.toString() ===
                    sender.toString()
            );
    
        if (!isMember) {
            throw new Error(
                "You are not a member of this workspace"
            );
        }
        const message = await dessesionmodel.findById(req.params.messageId);
        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }
        message.pinned = true;
        await message.save();
        return res.status(200).json({ message: "Message pinned successfully" });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

exports.unpinMessage = async (req, res) => {
    const workspace = req.params.workspaceId;
        const existingWorkspace =
            await workspaceModel.findById(
                workspace
            );
    
        if (!existingWorkspace) {
            throw new Error(
                "Workspace not found"
            );
        }
    
        const isMember =
            existingWorkspace.members.some(
                member =>
                    member.user.toString() ===
                    sender.toString()
            );
    
        if (!isMember) {
            throw new Error(
                "You are not a member of this workspace"
            );
        }

        const message = await dessesionmodel.findById(req.params.messageId);
        if (!message) {
            return res.status(404).json({ error: "Message not found" });
        }
        message.pinned = false;
        await message.save();
        return res.status(200).json({ message: "Message unpinned successfully" });
    } catch (error) {
        return res.status(500).json({ error: error.message });
    }
};

exports.getPinnedMessages = async (req, res) => {
    const workspace = req.params.workspaceId;

        const existingWorkspace =
            await workspaceModel.findById(
                workspace
            );
    
        if (!existingWorkspace) {
            throw new Error(
                "Workspace not found"
            );
        }
    
        const isMember =
            existingWorkspace.members.some(
                member =>
                    member.user.toString() ===
                    sender.toString()
            );
    
        if (!isMember) {
            throw new Error(
                "You are not a member of this workspace"
            );
        }
    const pinnedMessages = await dessesionmodel.find({ workspace: workspace, isPinned: true }).populate('sender', 'name email').populate('mentions', 'name email').populate('replyTo').populate('pinnedBy', 'name email');
    return res.status(200).json(pinnedMessages);
}