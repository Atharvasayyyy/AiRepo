const workspaceModel = require("../model/workspace.model");
const { validationResult } = require("express-validator");
const workspaceService = require("../services/workspace.services");

exports.createWorkspace = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { name, description, members } = req.body;

    try {
        const workspace = await workspaceService.createWorkspace({
            name,
            description,
            members,
            owner: req.user.id
        });

        return res.status(201).json({
            success: true,
            message: "Workspace created successfully",
            workspace
        });
    } catch (error) {
        console.error(error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};

exports.getDashboard = async (req, res) => {
    try {
        const userId = req.user.id;

        const workspaces = await workspaceService.getWorkspacesByUserId(userId);

        if (!workspaces || workspaces.length === 0) {
            return res.status(404).json({
                success: false,
                message:
                    "No workspaces found for this user"
            });
        }

        return res.status(200).json({
            success: true,
            count: workspaces.length,
            workspaces
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });

    }
};

exports.getWorkspaceById = async (req, res) => {
    try {
        const { workspaceId } = req.params;

        if (!workspaceId) {
            return res.status(400).json({
                success: false,
                message: "Workspace ID is required"
            });
        }

        const workspace = await workspaceService.getWorkspaceById(workspaceId);

        if (!workspace) {
            return res.status(404).json({
                success: false,
                message: "Workspace not found"
            });
        }

        return res.status(200).json({
            success: true,
            workspace
        });

    } catch (error) {

        console.error(error);

        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });

    }
};

exports.deleteWorkspace = async (req, res) => {
    const { workspaceId } = req.params;

    if (!workspaceId) {
        return res.status(400).json({ message: "Workspace ID is required" });
    }

    try {
        const workspace = await workspaceService.deleteWorkspace(workspaceId);
        if (!workspace) {
            return res.status(404).json({ message: "Workspace not found" });
        }
        res.json({ message: "Workspace deleted successfully" });
    } catch (error) {
        res.status(500).json({ message: "Server error" });
    }
};