const workspaceModel = require("../models/workspace.model");

module.exports.createWorkspace = async (req, res) => {
    try {
        const { name, description } = req.body;

        const ownerId = req.user._id;

        const workspace = await workspaceModel.create({
            name,
            description,

            owner: ownerId,

            members: [
                {
                    user: ownerId,
                    role: "owner"
                }
            ]
        });

        res.status(201).json({
            success: true,
            message: "Workspace created successfully",
            workspace
        });

    } catch (error) {
        res.status(500).json({
            success: false,
            message: error.message
        });
    }
};