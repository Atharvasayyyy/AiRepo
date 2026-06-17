const mongoose = require("mongoose");

const UserSchema = new mongoose.Schema(
    {
        username: {
            type: String,
            required: true,
            unique: true,
            trim: true,
        },
        email: {
            type: String,
            required: true,
            unique: true,
            trim: true,
            lowercase: true,
        },
        password: {
            type: String,
            required: true,
        },
        isBlacklisted: {
            type: Boolean,
            default: false,
        },
        blacklistedTokens: {
            type: [String],
            default: [],
        },
        favoritePages: [
            {
                type: mongoose.Schema.Types.ObjectId,
                ref: "Page"
            }
        ],
        recentPages: [
            {
                page: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: "Page"
                },
                viewedAt: {
                    type: Date,
                    default: Date.now
                }
            }
        ],
    },
    { timestamps: true }
);

const User = mongoose.model("User", UserSchema);
module.exports = User;
