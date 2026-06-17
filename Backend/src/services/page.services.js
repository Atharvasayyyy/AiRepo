const pageModel = require("../model/pages.model");

const pagePopulate = [
    { path: "workspace", select: "name description owner members", populate: [
        { path: "owner", select: "username email" },
        { path: "members.user", select: "username email" }
    ] },
    { path: "createdBy", select: "username email" },
    { path: "modifiedBy", select: "username email" }
];

exports.createPage = async (pageData) => {

    if (
        !pageData.title ||
        !pageData.workspace ||
        !pageData.createdBy
    ) {
        throw new Error(
            "Title, Workspace and Creator are required"
        );
    }

    const page = await pageModel.create({
        title: pageData.title,

        content: pageData.content || "",

        workspace: pageData.workspace,

        createdBy: pageData.createdBy,

        modifiedBy:
            pageData.modifiedBy ||
            pageData.createdBy
    });

    return page.populate(pagePopulate);
};

exports.getPageById = async (pageId) => {
    return pageModel.findById(pageId).populate(pagePopulate);
};

exports.getPagesByWorkspace = async (workspaceId) => {
    return pageModel
        .find({ workspace: workspaceId, isArchived: false })
        .sort({ updatedAt: -1 })
        .populate(pagePopulate);
};

exports.updatePage = async (pageId, pageData) => {
    const updateFields = {};

    if (pageData.title !== undefined) {
        updateFields.title = pageData.title;
    }

    if (pageData.content !== undefined) {
        updateFields.content = pageData.content;
    }

    if (pageData.workspace !== undefined) {
        updateFields.workspace = pageData.workspace;
    }

    if (pageData.modifiedBy !== undefined) {
        updateFields.modifiedBy = pageData.modifiedBy;
    }

    if (Object.keys(updateFields).length === 0) {
        throw new Error("At least one page field is required to update");
    }

    return pageModel.findByIdAndUpdate(pageId, updateFields, { new: true }).populate(pagePopulate);
};

exports.deletePage = async (pageId) => {
    return pageModel.findByIdAndDelete(pageId);
};

exports.archivePage = async (pageId) => {
    return pageModel.findByIdAndUpdate(pageId, { isArchived: true }, { new: true }).populate(pagePopulate);
};

exports.unarchivePage = async (pageId) => {
    return pageModel.findByIdAndUpdate(pageId, { isArchived: false }, { new: true }).populate(pagePopulate);
};

