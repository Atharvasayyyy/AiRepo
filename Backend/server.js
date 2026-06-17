const http = require("http");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const { Server } = require("socket.io");

dotenv.config();

const connecttodb = require("./src/db/db");
const app = require("./src/app");

app.use(cors());
app.use(cookieParser());
app.use(morgan("dev"));

connecttodb();

// Create HTTP Server
const server = http.createServer(app);

// Attach Socket.IO
const io = new Server(server, {
    cors: {
        origin: "*"
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

server.listen(PORT, () => {
    console.log(
        `Server is running on port ${PORT}`
    );
});