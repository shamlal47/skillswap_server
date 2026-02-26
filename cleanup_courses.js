import mongoose from 'mongoose';
import Course from './model/course.model.js';
import dotenv from 'dotenv';

dotenv.config();

const cleanupDuplicates = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mini_project');
        console.log('Connected to MongoDB');

        const courses = await Course.find({});
        console.log(`Total courses before cleanup: ${courses.length}`);

        const uniqueTitles = new Set();
        const toDelete = [];

        for (const course of courses) {
            if (uniqueTitles.has(course.title)) {
                toDelete.push(course._id);
            } else {
                uniqueTitles.add(course.title);
            }
        }

        if (toDelete.length > 0) {
            const result = await Course.deleteMany({ _id: { $in: toDelete } });
            console.log(`Deleted ${result.deletedCount} duplicate courses.`);
        } else {
            console.log('No duplicates found.');
        }

        const remaining = await Course.countDocuments();
        console.log(`Total courses after cleanup: ${remaining}`);

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

cleanupDuplicates();
