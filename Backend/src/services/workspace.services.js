const workspaceModel = require("../model/workspace.model");

module.exports.createWorkspace = async (workspaceData) => {
    const members = Array.isArray(workspaceData.members) ? workspaceData.members : [];

    const workspaceMembers = [
        {
            user: workspaceData.owner,
            role: "owner"
        },
        ...members
            .filter((memberId) => memberId && memberId.toString() !== workspaceData.owner.toString())
            .map((memberId) => ({
                user: memberId,
                role: "member"
            }))
    ];

    return workspaceModel.create({
        name: workspaceData.name,
        description: workspaceData.description || "",
        owner: workspaceData.owner,
        members: workspaceMembers
    });
};

module.exports.getWorkspacesByUserId = async (userId) => {
    return workspaceModel.find({
        $or: [
            { owner: userId },
            { "members.user": userId }
        ]
    })
        .populate('owner', 'username email')
        .populate('members.user', 'username email')
        .sort({ createdAt: -1 });
};

module.exports.getWorkspaceById = async (workspaceId) => {
    return workspaceModel
        .findById(workspaceId)
        .populate('owner', 'username email')
        .populate('members.user', 'username email');
};

module.exports.deleteWorkspace = async (workspaceId) => {
    return workspaceModel.findByIdAndDelete(workspaceId);
};

module.exports.updateWorkspace = async (workspaceId, updateData) => {
    return workspaceModel.findByIdAndUpdate(workspaceId, updateData, { new: true });
};
