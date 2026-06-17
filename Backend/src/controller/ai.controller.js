const aiService = require("../services/aiservices");
const dessesionService = require("../services/dessesion.services");

const actionPrompts = {
    summarize: "Summarize the current page clearly and concisely.",
    tasks: "Extract actionable tasks from the current page.",
    decisions: "Extract decisions from the current page.",
    prd: "Generate a practical PRD from the current page."
};

exports.runAction = async (req, res) => {
    const { action, pageContent = "", chatHistory = "", userMessage = "", workspaceId } = req.body;
    const prompt = actionPrompts[action];

    if (!prompt) {
        return res.status(400).json({ success: false, message: "Invalid AI action" });
    }

    try {
        const content = await aiService.generateResponse({
            userMessage: userMessage || prompt,
            pageContent,
            chatHistory
        });

        let message = null;
        if (workspaceId) {
            message = await dessesionService.createMessage({
                content,
                workspace: workspaceId,
                sender: req.user._id,
                type: "ai_message",
                metadata: { action }
            });
        }

        return res.status(200).json({ success: true, action, content, message });
    } catch (error) {
        return res.status(500).json({
            success: false,
            message: error.message || "AI request failed"
        });
    }
};
