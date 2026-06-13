const express = require('express');
const app = express();
const userRouter = require('./Routes/user.route');
const workspaceRouter = require('./Routes/workspace.route');

app.use(express.json());
app.use(express.urlencoded({ extended: true }));


app.use('/test', (req, res) => {
    res.send('Hello World');
});

app.use('/api/auth', userRouter);
app.use('/api/workspace', workspaceRouter);

module.exports = app;