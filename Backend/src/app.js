const express = require('express');
const cors = require("cors");
const cookieParser = require("cookie-parser");
const morgan = require("morgan");
const app = express();
const userRouter = require('./routes/user.route');
const workspaceRouter = require('./routes/workspace.route');
const PageRouter = require('./routes/page.route');
const inviteRouter = require('./routes/invite.route');
const dessesionRouter = require('./routes/dessesion.route');
const searchRouter = require('./routes/search.route');
const aiRouter = require('./routes/ai.route');
const pageActivityRouter = require('./routes/pageActivity.route');

const allowedOrigins = process.env.CLIENT_URL
    ? process.env.CLIENT_URL.split(",").map((origin) => origin.trim()).filter(Boolean)
    : [];

app.use(cors({
    origin(origin, callback) {
        if (!origin || allowedOrigins.length === 0 || allowedOrigins.includes(origin)) {
            callback(null, true);
            return;
        }

        callback(new Error("Not allowed by CORS"));
    },
    credentials: true
}));
app.use(cookieParser());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

app.get("/", (req, res) => {
    res.status(200).json({
        success: true,
        message: "DevNotes Backend Running"
    });
});

app.get("/health", (req, res) => {
    res.status(200).json({
        success: true,
        status: "healthy"
    });
});

app.use('/test', (req, res) => {
    res.send('Hello World');
});

app.use('/api/auth', userRouter);
app.use('/api/workspace', workspaceRouter);
app.use('/api', pageActivityRouter);
app.use('/api/page', PageRouter);
app.use('/api/invite', inviteRouter);
app.use('/api/discussion', dessesionRouter);
app.use('/api/dessesion', dessesionRouter);
app.use('/api/discussions', dessesionRouter);
app.use('/api/search', searchRouter);
app.use('/api/ai', aiRouter);

module.exports = app;
