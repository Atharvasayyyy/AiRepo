const mongoose = require("mongoose");
const { config } = require("../config/env");

const connecttodb = async () => {
    try {
        await mongoose.connect(config.mongoUrl, {
            serverSelectionTimeoutMS: 10000
        });

        if (config.env !== "production") {
            console.log("MongoDB connected successfully");
        }

    } catch (error) {
        console.error("Error connecting to MongoDB:", error.message);

        process.exit(1);
    }
};

module.exports = connecttodb;
