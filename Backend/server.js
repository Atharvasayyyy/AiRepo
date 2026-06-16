const http = require("http");
const dotenv = require("dotenv");

dotenv.config();

const connecttodb = require("./src/db/db");

const app = require("./src/app");

connecttodb();

const server = http.createServer(app);
const { Server } = require("socket.io");
const registerSocketHandlers = require("./src/sockets/socket");

const io = new Server(server, {
    cors: {
        origin: "*",
        methods: ["GET", "POST", "PUT", "DELETE"]
    }
});

registerSocketHandlers(io);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(
        `Server is running on port ${PORT}`
    );
});
