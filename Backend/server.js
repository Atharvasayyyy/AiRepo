console.log("1. File started");

const http = require('http');
const express = require('express');
const dotenv = require('dotenv');
const cors = require('cors');
const cookieParser = require('cookie-parser');
const connecttodb = require('./src/db/db');

const app = express();
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

console.log("Starting server...");
console.log("PORT =", process.env.PORT);

dotenv.config();
app.use(cors());
app.use(cookieParser());
connecttodb();

const server = http.createServer(app);

const PORT = process.env.PORT || 3000;

server.listen(PORT, () => {
    console.log(`Server is running on port ${PORT}`);
});
