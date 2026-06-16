const discussionModel = require('../model/dessesion.model');
const workspaceModel = require('../model/workspace.model');

exports.createMessage = async (messageData) => {
    const {
        content,
        workspace,
        sender,
        type,
        mentions,
        replyTo,
        isPinned,
        pinnedBy,
        pinnedAt
    } = messageData;

    if (!content || !workspace || !sender) {
        throw new Error('Content, workspace and sender are required');
    }

    const existingWorkspace = await workspaceModel.findById(workspace);

    if (!existingWorkspace) {
        const error = new Error('Workspace not found');
        error.statusCode = 404;
        throw error;
    }

    const isMember = existingWorkspace.members.some(
        member => member.user && member.user.toString() === sender.toString()
    );

    if (!isMember) {
        const error = new Error('You are not a member of this workspace');
        error.statusCode = 403;
        throw error;
    }

    if (replyTo) {
        const parentMessage = await discussionModel.findOne({
            _id: replyTo,
            workspace
        });

        if (!parentMessage) {
            const error = new Error('Parent message not found');
            error.statusCode = 404;
            throw error;
        }
    }

    return discussionModel.create({
        content,
        workspace,
        sender,
        type: type || 'message',
        mentions: mentions || [],
        replyTo: replyTo || null,
        isPinned: isPinned || false,
        pinnedBy: pinnedBy || null,
        pinnedAt: pinnedAt || null
    });
};
