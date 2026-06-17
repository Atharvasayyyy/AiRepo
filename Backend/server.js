const http = require("http");
const dotenv = require("dotenv");
const { Server } = require("socket.io");

process.on("uncaughtException", (err) => {
    console.error("UNCAUGHT EXCEPTION:");
    console.error(err);
});

process.on("unhandledRejection", (err) => {
    console.error("UNHANDLED REJECTION:");
    console.error(err);
});

const path = require("path");

dotenv.config({
    path: path.join(__dirname, ".env")
});

const connecttodb = require("./src/db/db");
const app = require("./src/app");

const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",").map((origin) => origin.trim()).filter(Boolean)
    : [];

connecttodb();

// Create HTTP Server
const server = http.createServer(app);

// Attach Socket.IO
const io = new Server(server, {
    cors: {
        origin: allowedOrigins.length > 0 ? allowedOrigins : "*",
        credentials: true
    }
});

io.on("connection", (socket) => {
    console.log(
        "User Connected:",
        socket.id
    );

    socket.on(
        "disconnect",
        () => {
            console.log(
                "User Disconnected:",
                socket.id
            );
        }
    );
});

const PORT =
    process.env.PORT || 5000;

console.log("PORT =", process.env.PORT);
console.log("MONGO_URL =", process.env.MONGO_URL);
console.log("__dirname =", __dirname);

server.listen(PORT, () => {
    console.log(
        `Server is running on port ${PORT}`
    );
});
