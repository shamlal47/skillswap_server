import mongoose from 'mongoose';
import Course from './model/course.model.js';
import dotenv from 'dotenv';

dotenv.config();

const checkDuplicates = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mini_project');
        console.log('Connected to MongoDB');

        const courses = await Course.find({});
        console.log(`Total courses: ${courses.length}`);

        const uniqueTitles = new Set();
        const duplicates = [];

        courses.forEach(c => {
            if (uniqueTitles.has(c.title)) {
                duplicates.push(c.title);
            } else {
                uniqueTitles.add(c.title);
            }
        });

        console.log(`Unique titles: ${uniqueTitles.size}`);
        console.log(`Duplicate count: ${duplicates.length}`);

        if (duplicates.length > 0) {
            console.log('Sample duplicates:', duplicates.slice(0, 5));
        }

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

checkDuplicates();
