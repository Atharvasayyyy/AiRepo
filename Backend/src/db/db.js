const mongoose = require("mongoose");

const connecttodb = async () => {
    try {
        console.log("MONGO_URL =", process.env.MONGO_URL);
        console.log("MONGO_URI =", process.env.MONGO_URI);

        const rawMongoUri =
            process.env.MONGO_URL ||
            process.env.MONGO_URI;

        if (!rawMongoUri) {
            throw new Error(
                "Missing Mongo URI. Set MONGO_URL in .env"
            );
        }

        console.log("Connecting to:");
        console.log(rawMongoUri);

        await mongoose.connect(rawMongoUri, {
            serverSelectionTimeoutMS: 10000
        });

        console.log("MongoDB connected successfully");

    } catch (error) {
        console.error("Error connecting to MongoDB:");
        console.error(error);

        process.exit(1); // only exit when connection fails
    }
};

module.exports = connecttodb;