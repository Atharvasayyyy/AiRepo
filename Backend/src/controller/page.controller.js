const { validationResult } = require("express-validator");
const pageService = require("../services/page.services");

exports.createPage = async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ errors: error.array() });
    }

    try {
        const { title, content, workspace } = req.body;
        const createdBy = req.user.id;
        const modifiedBy = req.user.id;

        if (!title || !workspace || !createdBy || !modifiedBy) {
            return res.status(400).json({ error: "Missing required fields" });
        }

        const page = await pageService.createPage({
            title,
            content,
            workspace,
            createdBy,
            modifiedBy,
        });

        res.status(201).json({ message: "Page created successfully", page });
    } catch (error) {
        console.error("Error creating page:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.getPageById = async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ errors: error.array() });
    }

    const { pageId } = req.params;
    if (!pageId) {
        return res.status(400).json({ error: "Page ID is required" });
    }

    try {
        const page = await pageService.getPageById(pageId);
        if (!page) {
            return res.status(404).json({ error: "Page not found" });
        }
        res.status(200).json({ page });

    } catch (error) {
        console.error("Error fetching page:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.updatePage = async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ errors: error.array() });
    }

    const { pageId } = req.params;
    if (!pageId) {
        return res.status(400).json({ error: "Page ID is required" });
    }

    try {
        const { title, content, workspace } = req.body;
        const modifiedBy = req.user.id;
        if (!title && !content && !workspace) {
            return res.status(400).json({ error: "At least one field is required" });
        }

        const updatedPage = await pageService.updatePage(pageId, {
            title,
            content,
            workspace,
            modifiedBy,
        });

        if (!updatedPage) {
            return res.status(404).json({ error: "Page not found" });
        }

        res.status(200).json({ message: "Page updated successfully", page: updatedPage });

    } catch (error) {
        console.error("Error updating page:", error);
        res.status(500).json({ error: error.message || "Internal server error" });
    }
};

exports.deletePage = async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ errors: error.array() });
    }

    const { pageId } = req.params;
    if (!pageId) {
        return res.status(400).json({ error: "Page ID is required" });
    }

    try {
        const deletedPage = await pageService.deletePage(pageId);
        if (!deletedPage) {
            return res.status(404).json({ error: "Page not found" });
        }
        res.status(200).json({ message: "Page deleted successfully" });

    } catch (error) {
        console.error("Error deleting page:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.archivePage = async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ errors: error.array() });
    }

    const { pageId } = req.params;
    if (!pageId) {
        return res.status(400).json({ error: "Page ID is required" });
    }

    try {
        const archivedPage = await pageService.archivePage(pageId);
        if (!archivedPage) {
            return res.status(404).json({ error: "Page not found" });
        }
        res.status(200).json({ message: "Page archived successfully", page: archivedPage });
    } catch (error) {
        console.error("Error archiving page:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};

exports.unarchivePage = async (req, res) => {
    const error = validationResult(req);
    if (!error.isEmpty()) {
        return res.status(400).json({ errors: error.array() });
    }

    const { pageId } = req.params;
    if (!pageId) {
        return res.status(400).json({ error: "Page ID is required" });
    }

    try {
        const unarchivedPage = await pageService.unarchivePage(pageId);
        if (!unarchivedPage) {
            return res.status(404).json({ error: "Page not found" });
        }
        res.status(200).json({ message: "Page unarchived successfully", page: unarchivedPage });
    } catch (error) {
        console.error("Error unarchiving page:", error);
        res.status(500).json({ error: "Internal server error" });
    }
};


