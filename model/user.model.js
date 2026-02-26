import mongoose from "mongoose";


const userSchema = new mongoose.Schema({
    name: {
        type: String,
        required: [true, 'Please add a name']
    },
    email: {
        type: String,
        required: [true, 'Please add an email'],
        unique: true,
        match: [/.+@.+\..+/, 'Please add a valid email']
    },
    password: {
        type: String,
        required: [true, 'Please add a password'],
        minlength: 6,
        select: false
    },
    skillsToTeach: {
        type: [String],
        default: []
    },

    skillsToLearn: {
        type: [String],
        default: []
    },

    profilePicture: {
        type: String,
        default: ''
    }

}, { timestamps: true });


const User = mongoose.model('User', userSchema);

export default User;