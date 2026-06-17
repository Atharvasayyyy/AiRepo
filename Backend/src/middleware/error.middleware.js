function notFound(req, res, next) {
    const error = new Error(`Route not found: ${req.originalUrl}`);
    error.statusCode = 404;
    next(error);
}

function errorHandler(error, req, res, next) {
    const statusCode = error.statusCode || error.status || 500;

    res.status(statusCode).json({
        success: false,
        message: error.message || "Internal Server Error"
    });
}

module.exports = {
    notFound,
    errorHandler
};
