import mongoose from 'mongoose';
import User from './model/user.model.js';
import Course from './model/course.model.js';
import Match from './model/match.model.js';
import dotenv from 'dotenv';

dotenv.config();

const debugDB = async () => {
    try {
        await mongoose.connect(process.env.MONGO_URI || 'mongodb://localhost:27017/mini_project');
        console.log('Connected to MongoDB');

        const users = await User.find({});
        console.log('\n--- USERS ---');
        users.forEach(u => {
            console.log(`ID: ${u._id}, Name: ${u.name}, Teaches: ${u.course}, Wants: ${u.courseNeeded}`);
            console.log(`Raw:`, JSON.stringify(u, null, 2));
        });

        const courses = await Course.find({});
        console.log('\n--- COURSES ---');
        courses.forEach(c => {
            console.log(`ID: ${c._id}, Title: ${c.title}, Required Skill: ${c.requiredSkill}`);
        });

        const matches = await Match.find({});
        console.log('\n--- MATCHES ---');
        matches.forEach(m => {
            console.log(`ID: ${m._id}, User1: ${m.user1}, User2: ${m.user2}, Skill1: ${m.matchedSkill}, Skill2: ${m.skillUser2Offers}`);
        });

    } catch (error) {
        console.error('Error:', error);
    } finally {
        await mongoose.disconnect();
    }
};

debugDB();
