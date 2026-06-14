const pageModel = require("../model/pages.model");

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

    return page;
};

