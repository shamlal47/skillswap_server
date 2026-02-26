
import mongoose from 'mongoose';
import Course from './model/course.model.js';
import dotenv from 'dotenv';

dotenv.config();

const run = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mini_project');
        console.log('Connected to DB');

        const courses = await Course.find({});
        console.log(`Total courses: ${courses.length}`);

        const titles = courses.map(c => c.title);
        const uniqueTitles = new Set(titles);

        if (titles.length !== uniqueTitles.size) {
            console.log('Duplicates found based on title!');
            const counts = {};
            titles.forEach(t => counts[t] = (counts[t] || 0) + 1);
            for (const [t, c] of Object.entries(counts)) {
                if (c > 1) console.log(`- "${t}": ${c} copies`);
            }
        } else {
            console.log('No duplicates found based on title.');
        }

    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};

run();
