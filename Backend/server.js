const http = require("http");
const dotenv = require("dotenv");
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const { Server } = require("socket.io");

const io = new Server(server,{
    cors:{
        origin:"*"
    }
});

dotenv.config();

const connecttodb = require("./src/db/db");

const app = require("./src/app");

app.use(cors());
app.use(cookieParser());
app.use(morgan("dev"));

connecttodb();

const server = http.createServer(app);

const PORT = process.env.PORT || 5000;

server.listen(PORT, () => {
    console.log(
        `Server is running on port ${PORT}`
    );
});