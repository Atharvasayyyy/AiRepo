const mongoose = require("mongoose");

const connecttodb = async () => {
    try {
        const rawMongoUri = process.env.MONGO_URL || process.env.MONGO_URI;

        if (!rawMongoUri) {
            throw new Error("Missing Mongo URI. Set MONGO_URL in .env");
        }

        // Remove legacy options that are no longer supported by newer MongoDB drivers.
        const mongoUri = rawMongoUri
            .replace(/([?&])(useNewUrlParser|useUnifiedTopology)=[^&]*/gi, "$1")
            .replace(/\?&/, "?")
            .replace(/[?&]$/, "");

        await mongoose.connect(mongoUri);
        console.log("MongoDB connected successfully");
    } catch (error) {   
        console.error("Error connecting to MongoDB:", error);
        process.exit(1);
    }
};

module.exports = connecttodb;