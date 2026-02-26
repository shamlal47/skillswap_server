import User from '../model/user.model.js';

export const getUserProfile = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userId = req.user.id || req.user._id;

    try {
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        next(error);
    }
}

export const updateUserProfile = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userId = req.user.id || req.user._id;

    const { name, email, skillsToTeach, skillsToLearn, profilePicture } = req.body || {};

    try {
        const user = await User.findById(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.name = name || user.name;
        user.email = email || user.email;
        if (skillsToTeach) user.skillsToTeach = Array.isArray(skillsToTeach) ? skillsToTeach : [skillsToTeach];
        if (skillsToLearn) user.skillsToLearn = Array.isArray(skillsToLearn) ? skillsToLearn : [skillsToLearn];
        if (req.file) user.profilePicture = req.file.path;
        if (profilePicture && !req.file) user.profilePicture = profilePicture; // Fallback to body if no file but url provided (optional)

        await user.save();

        res.status(200).json({
            success: true,
            user
        });
    } catch (error) {
        next(error);
    }
}

export const deleteUserAccount = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }

    const userId = req.user.id || req.user._id;

    try {
        const user = await User.findByIdAndDelete(userId);
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        res.status(200).json({
            success: true,
            message: 'User account deleted successfully'
        });
    } catch (error) {
        next(error);
    }
}

export const getAllUsers = async (req, res, next) => {
    try {
        const users = await User.find().select('-password');
        res.status(200).json({
            success: true,
            users
        });
    } catch (error) {
        next(error);
    }
}
