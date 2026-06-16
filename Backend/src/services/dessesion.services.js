const discussionModel =
require("../models/discussion.model");

const workspaceModel =
require("../models/workspace.model");

exports.createMessage = async (
    messageData
) => {

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

    if (
        !content ||
        !workspace ||
        !sender
    ) {
        throw new Error(
            "Content, workspace and sender are required"
        );
    }

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

    if (replyTo) {

        const parentMessage =
            await discussionModel.findById(
                replyTo
            );

        if (!parentMessage) {
            throw new Error(
                "Parent message not found"
            );
        }
    }

    const message =
        await discussionModel.create({
            content,
            workspace,
            sender,
            type:
                type || "message",
            mentions:
                mentions || [],
            replyTo:
                replyTo || null,
            isPinned:
                isPinned || false,
            pinnedBy:
                pinnedBy || null,
            pinnedAt:
                pinnedAt || null
        });

    return message;
};