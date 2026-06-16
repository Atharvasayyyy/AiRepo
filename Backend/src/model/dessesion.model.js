const mongoose = require("mongoose");

const discussionMessageSchema =
new mongoose.Schema(
{
    workspace: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "Workspace",
        required: true
    },

    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        required: true
    },

    content: {
        type: String,
        required: true,
        trim: true
    },

    type: {
        type: String,
        enum: [
            "message",
            "ai",
            "decision",
            "system"
        ],
        default: "message"
    },

    mentions: [
        {
            type: mongoose.Schema.Types.ObjectId,
            ref: "User"
        }
    ],

    replyTo: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "DiscussionMessage",
        default: null
    },

    isPinned: {
        type: Boolean,
        default: false
    },

    pinnedBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
        default: null
    },

    pinnedAt: {
        type: Date,
        default: null
    },

    edited: {
        type: Boolean,
        default: false
    },

    editedAt: {
        type: Date,
        default: null
    },

    metadata: {
        type: mongoose.Schema.Types.Mixed,
        default: {}
    }

},
{
    timestamps: true
});

module.exports = mongoose.model(
    "DiscussionMessage",
    discussionMessageSchema
);