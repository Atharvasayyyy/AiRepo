const required = ["MONGO_URL", "JWT_SECRET", "CLIENT_URL"];

function validateEnv() {
    const missing = required.filter((key) => !process.env[key]);

    if (missing.length > 0) {
        throw new Error(`Missing required environment variables: ${missing.join(", ")}`);
    }
}

function list(value) {
    return (value || "")
        .split(",")
        .map((item) => item.trim())
        .filter(Boolean);
}

module.exports = {
    validateEnv,
    config: {
        env: process.env.NODE_ENV || "development",
        port: process.env.PORT || 5000,
        mongoUrl: process.env.MONGO_URL,
        jwtSecret: process.env.JWT_SECRET,
        mistralApiKey: process.env.MISTRAL_API_KEY,
        clientUrls: list(process.env.CLIENT_URL),
        cookieSecure: process.env.NODE_ENV === "production"
    }
};
