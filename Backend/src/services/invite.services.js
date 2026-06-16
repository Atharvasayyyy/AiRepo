const workspaceModel = require('../model/workspace.model');

function createError(message, statusCode) {
    const error = new Error(message);
    error.statusCode = statusCode;
    return error;
}

async function getWorkspaceForOwner(workspaceId, ownerId) {
    const workspace = await workspaceModel.findById(workspaceId);

    if (!workspace) {
        throw createError('Workspace not found', 404);
    }

    if (workspace.owner.toString() !== ownerId.toString()) {
        throw createError('Only workspace owner can manage members', 403);
    }

    return workspace;
}

exports.createInvite = async (inviteData) => {
    const { userId, role, workspaceId, senderId } = inviteData;

    if (!userId || !role || !workspaceId || !senderId) {
        throw createError('All fields are required', 400);
    }

    const workspace = await getWorkspaceForOwner(workspaceId, senderId);

    const alreadyMember = workspace.members.some(
        member => member.user && member.user.toString() === userId.toString()
    );

    if (alreadyMember) {
        throw createError('User already a member', 400);
    }

    workspace.members.push({
        user: userId,
        role
    });

    await workspace.save();

    return workspace;
};

exports.getInvites = async (workspaceId, userId) => {
    const workspace = await workspaceModel
        .findById(workspaceId)
        .populate('members.user', 'username email');

    if (!workspace) {
        throw createError('Workspace not found', 404);
    }

    const isOwner = workspace.owner.toString() === userId.toString();
    const isMember = workspace.members.some(
        member => member.user && member.user._id.toString() === userId.toString()
    );

    if (!isOwner && !isMember) {
        throw createError('Access denied', 403);
    }

    return workspace.members;
};

exports.updateInvite = async (workspaceId, userId, newRole, ownerId) => {
    const workspace = await getWorkspaceForOwner(workspaceId, ownerId);

    const memberIndex = workspace.members.findIndex(
        member => member.user && member.user.toString() === userId.toString()
    );

    if (memberIndex === -1) {
        throw createError('User is not a member', 404);
    }

    workspace.members[memberIndex].role = newRole;
    await workspace.save();

    return workspace;
};

exports.deleteInvite = async (workspaceId, userId, ownerId) => {
    const workspace = await getWorkspaceForOwner(workspaceId, ownerId);

    const memberIndex = workspace.members.findIndex(
        member => member.user && member.user.toString() === userId.toString()
    );

    if (memberIndex === -1) {
        throw createError('User is not a member', 404);
    }

    workspace.members.splice(memberIndex, 1);

    await workspace.save();

    return workspace;
};
