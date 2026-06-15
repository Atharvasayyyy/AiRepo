const workspaceModel =
require("../models/workspace.model");

exports.createInvite = async (
    inviteData
) => {

    const {
        userId,
        role,
        workspaceId,
        senderId
    } = inviteData;

    if (
        !userId ||
        !role ||
        !workspaceId ||
        !senderId
    ) {
        throw new Error(
            "All fields are required"
        );
    }

    const workspace =
        await workspaceModel.findById(
            workspaceId
        );

    if (!workspace) {
        throw new Error(
            "Workspace not found"
        );
    }

    if (
        !workspace.owner.equals(
            senderId
        )
    ) {
        throw new Error(
            "Only workspace owner can invite members"
        );
    }

    const alreadyMember =
        workspace.members.some(
            member =>
                member.user.toString() ===
                userId.toString()
        );

    if (alreadyMember) {
        throw new Error(
            "User already a member"
        );
    }

    workspace.members.push({
        user: userId,
        role
    });

    await workspace.save();

    return workspace;
};

exports.getInvites = async (
    workspaceId,
    userId
) => {

    const workspace =
        await workspaceModel.findById(
            workspaceId
        )
        .populate(
            "members.user",
            "username email"
        );

    if (!workspace) {
        throw new Error(
            "Workspace not found"
        );
    }

    const isMember =
        workspace.members.some(
            member =>
                member.user._id.toString() ===
                userId.toString()
        );

    if (!isMember) {
        throw new Error(
            "Access denied"
        );
    }

    return workspace.members;
};

exports.updateInvite = async (
    workspaceId,
    userId,
    newRole
) => {
    const workspace =
        await workspaceModel.findById(
            workspaceId
        );
    if (!workspace) {
        throw new Error(
            "Workspace not found"
        );
    }

    const memberIndex =
        workspace.members.findIndex(
            member =>
                member.user.toString() ===
                userId.toString()
        );
    if (memberIndex === -1) {
        throw new Error(
            "User is not a member"
        );
    }
    workspace.members[memberIndex].role = newRole;
    await workspace.save();
    return workspace;
};

exports.deleteInvite = async (
    workspaceId,
    userId
) => {
    const workspace =
        await workspaceModel.findById(
            workspaceId
        );

    if (!workspace) {
        throw new Error(
            "Workspace not found"
        );
    }

    const memberIndex =
        workspace.members.findIndex(
            member =>
                member.user.toString() ===
                userId.toString()
        );

    if (memberIndex === -1) {
        throw new Error(
            "User is not a member"
        );
    }

    workspace.members.splice(memberIndex, 1);

    await workspace.save();

    return workspace;
};

