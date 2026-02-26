import mongoose from "mongoose";

const courseSchema = new mongoose.Schema({
    user: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    title: {
        type: String,
        required: true,
        unique: true,
    },
    description: {
        type: String,
        required: true,
    },
    demovideo: {
        type: String,
        required: true,
    },
    reviews: {
        type: [String],
        default: [],
    },
    starRating: {
        type: Number,
        default: 0,
    },
    duration: {
        type: String,
        required: true,
    },
    category: {
        type: String,
        required: true,
    },
    requiredSkill: {
        type: String,
        required: true,
    },
    thumbnail: {
        type: String,
        default: ''
    },



});

const Course = mongoose.model('Course', courseSchema);

export default Course;
