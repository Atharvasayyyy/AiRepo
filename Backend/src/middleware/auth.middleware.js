const jwt = require("jsonwebtoken");
const dotenv = require('dotenv');

dotenv.config();

const authMiddleware = (req, res, next) => {
    const token = req.header("Authorization")?.replace("Bearer ", "") || req.cookies?.token;
    if (!token) {
        return res.status(401).json({ message: "Access denied. No token provided." });
    }

    try {
        const decoded = jwt.verify(token, process.env.JWT_SECRET);

        if(!decoded || !decoded.id) {
            return res.status(401).json({ message: "Invalid token." });
        }
        
                req.user = {
                    ...decoded,
                    id: decoded.id,
                    _id: decoded.id,
                };
        next();
    } catch (error) {
        res.status(400).json({ message: "Invalid token." });
    }
};

module.exports = authMiddleware;
