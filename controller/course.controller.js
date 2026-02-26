import Course from "../model/course.model.js";
import User from "../model/user.model.js";

/**
 * Helper function to find common skills between two arrays (case-insensitive)
 */
const getCommonSkills = (listA, listB) => {
    const normalizedB = listB.map(s => s.toLowerCase());
    return listA.filter(skill => normalizedB.includes(skill.toLowerCase()));
};

export const createCourse = async (req, res) => {
    try {
        const courseData = req.body;

        // Add user ID from auth middleware
        if (req.user) {
            courseData.user = req.user.id || req.user._id;
        }

        // Handle file uploads (multiple files: demovideo and thumbnail)
        if (req.files) {
            if (req.files.demovideo && req.files.demovideo[0]) {
                courseData.demovideo = req.files.demovideo[0].path;
            }
            if (req.files.thumbnail && req.files.thumbnail[0]) {
                courseData.thumbnail = req.files.thumbnail[0].path;
            }
        }

        const course = await Course.create(courseData);
        res.status(201).json(course);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getAllCourses = async (req, res) => {
    try {
        const courses = await Course.find();
        res.status(200).json(courses);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const getCourseById = async (req, res) => {
    try {
        const course = await Course.findById(req.params.id);
        res.status(200).json(course);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const updateCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndUpdate(req.params.id, req.body, { new: true });
        res.status(200).json(course);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

export const deleteCourse = async (req, res) => {
    try {
        const course = await Course.findByIdAndDelete(req.params.id);
        res.status(200).json(course);
    } catch (error) {
        res.status(500).json({ error: error.message });
    }
};

/**
 * Find users who match with the current user based on skills
 * Bidirectional matching: 
 *   - Other user teaches what current user wants to learn
 *   - Other user wants to learn what current user teaches
 */
export const findMatches = async (req, res, next) => {
    try {
        const userId = req.user?.id || req.user?._id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // Get current user with their skills
        const currentUser = await User.findById(userId);
        if (!currentUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const mySkillsToTeach = currentUser.skillsToTeach || [];
        const mySkillsToLearn = currentUser.skillsToLearn || [];

        // If user has no skills set, return empty matches
        if (mySkillsToTeach.length === 0 || mySkillsToLearn.length === 0) {
            return res.status(200).json({ success: true, matches: [] });
        }

        // Query: Find users where they teach what I want to learn AND they want to learn what I teach
        // Using MongoDB $in for case-insensitive matching would require regex, so we'll do post-filtering
        const otherUsers = await User.find({
            _id: { $ne: userId },
            skillsToTeach: { $exists: true, $ne: [] },
            skillsToLearn: { $exists: true, $ne: [] }
        }).select('-password');

        const matchedResults = [];

        for (const otherUser of otherUsers) {
            const theirSkillsToTeach = otherUser.skillsToTeach || [];
            const theirSkillsToLearn = otherUser.skillsToLearn || [];

            // Check bidirectional match:
            // 1. They teach something I want to learn
            const skillsTheyCanTeachMe = getCommonSkills(theirSkillsToTeach, mySkillsToLearn);
            // 2. I teach something they want to learn
            const skillsICanTeachThem = getCommonSkills(mySkillsToTeach, theirSkillsToLearn);

            // Only proceed if BOTH directions have at least one matching skill
            if (skillsTheyCanTeachMe.length === 0 || skillsICanTeachThem.length === 0) {
                continue;
            }

            matchedResults.push({
                user: {
                    _id: otherUser._id,
                    name: otherUser.name,
                    email: otherUser.email,
                    profilePicture: otherUser.profilePicture,
                    skillsToTeach: otherUser.skillsToTeach,
                    skillsToLearn: otherUser.skillsToLearn
                },
                skillsTheyCanTeachYou: skillsTheyCanTeachMe,
                skillsYouCanTeachThem: skillsICanTeachThem
            });
        }

        res.status(200).json({ success: true, matches: matchedResults });
    } catch (error) {
        next(error);
    }
};

/**
 * Get courses that match the current user's skills to learn
 * (Simplified: returns courses where requiredSkill matches user's skillsToLearn)
 */
export const getMatchedCourses = async (req, res, next) => {
    try {
        const userId = req.user?.id || req.user?._id;
        if (!userId) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        // Get current user
        const currentUser = await User.findById(userId);
        if (!currentUser) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const mySkillsToLearn = currentUser.skillsToLearn || [];

        if (mySkillsToLearn.length === 0) {
            return res.status(200).json({ success: true, courses: [] });
        }

        // Find courses where requiredSkill matches any of user's skillsToLearn (case-insensitive)
        const skillRegexes = mySkillsToLearn.map(skill => new RegExp(`^${skill}$`, 'i'));
        const courses = await Course.find({
            requiredSkill: { $in: skillRegexes }
        }).select('-__v').lean();

        // Deduplicate courses by title
        const uniqueCoursesMap = new Map();
        for (const c of courses) {
            if (!uniqueCoursesMap.has(c.title)) {
                uniqueCoursesMap.set(c.title, c);
            }
        }
        const uniqueCourses = Array.from(uniqueCoursesMap.values());

        res.status(200).json({ success: true, courses: uniqueCourses });
    } catch (error) {
        next(error);
    }
};