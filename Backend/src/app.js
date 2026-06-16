const express = require('express');
const app = express();
const userRouter = require('./routes/user.route');
const workspaceRouter = require('./routes/workspace.route');
const PageRouter = require('./routes/page.route');
const inviteRouter = require('./routes/invite.route');
const dessesionRouter = require('./routes/dessesion.route');

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

module.exports = app;
