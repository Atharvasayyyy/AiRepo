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

app.use(cors());
app.use(cookieParser());
app.use(morgan("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/test', (req, res) => {
    res.send('Hello World');
});

app.use('/api/auth', userRouter);
app.use('/api/workspace', workspaceRouter);
app.use('/api/page', PageRouter);
app.use('/api/invite', inviteRouter);
app.use('/api/dessesion', dessesionRouter);
app.use('/api/discussions', dessesionRouter);
app.use('/api/search', searchRouter);

module.exports = app;
