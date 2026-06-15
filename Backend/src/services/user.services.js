const User = require('../model/user.model');

module.exports.createUser = async (userData) => {
    return User.create(userData);
};

module.exports.isBlacklisted = async (email) => {
    const user = await User.findOne({ email });
    return Boolean(user?.isBlacklisted);
};
