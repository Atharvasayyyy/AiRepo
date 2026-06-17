const User = require("../model/user.model");
const Page = require("../model/pages.model");

const pagePopulate = [
    { path: "workspace", select: "name description owner" },
    { path: "createdBy", select: "username email" },
    { path: "modifiedBy", select: "username email" }
];

exports.addFavorite = async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $addToSet: { favoritePages: req.params.pageId } },
        { new: true }
    ).populate({ path: "favoritePages", populate: pagePopulate });

    res.status(200).json({ success: true, favorites: user.favoritePages });
};

exports.removeFavorite = async (req, res) => {
    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $pull: { favoritePages: req.params.pageId } },
        { new: true }
    ).populate({ path: "favoritePages", populate: pagePopulate });

    res.status(200).json({ success: true, favorites: user.favoritePages });
};

exports.getFavorites = async (req, res) => {
    const user = await User.findById(req.user._id)
        .populate({ path: "favoritePages", populate: pagePopulate });

    res.status(200).json({ success: true, favorites: user?.favoritePages || [] });
};

exports.trackRecent = async (req, res) => {
    const page = await Page.findById(req.params.pageId);
    if (!page) {
        return res.status(404).json({ success: false, message: "Page not found" });
    }

    await User.findByIdAndUpdate(req.user._id, {
        $pull: { recentPages: { page: req.params.pageId } }
    });

    const user = await User.findByIdAndUpdate(
        req.user._id,
        { $push: { recentPages: { $each: [{ page: req.params.pageId, viewedAt: new Date() }], $position: 0, $slice: 20 } } },
        { new: true }
    ).populate({ path: "recentPages.page", populate: pagePopulate });

    res.status(200).json({ success: true, recent: user.recentPages });
};

exports.getRecent = async (req, res) => {
    const user = await User.findById(req.user._id)
        .populate({ path: "recentPages.page", populate: pagePopulate });

    res.status(200).json({ success: true, recent: user?.recentPages || [] });
};
