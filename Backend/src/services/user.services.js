const usermodel = require('../model/user.model');

module.exports.register = async (req, res) => {
    const { firstName, lastName, email, password } = req.body;

    if (!firstName || !lastName || !email || !password) {
        return res.status(400).json({
            message: 'All fields are required'
        });
    }

    const hashedPassword = await usermodel.hashPassword(password);

    const user = await usermodel.create({
        fullName: {
            firstName,
            lastName
        },
        email,
        password: hashedPassword
    });

    res.status(201).json({
        message: 'User registered successfully',
        user
    });
};

module.exports.isBlacklisted = async (email) => {
    const user = await usermodel.findOne({ email });
    return user ? user.isBlacklisted : false;
};
