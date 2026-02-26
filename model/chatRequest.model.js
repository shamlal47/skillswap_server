import mongoose from "mongoose";

const chatRequestSchema = new mongoose.Schema({
    sender: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    receiver: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    course: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Course',
        required: true
    },
    status: {
        type: String,
        enum: ['pending', 'accepted', 'rejected'],
        default: 'pending'
    },
    message: {
        type: String,
        default: ''
    }
}, {
    timestamps: true
});

// Prevent duplicate requests
chatRequestSchema.index({ sender: 1, receiver: 1, course: 1 }, { unique: true });

const ChatRequest = mongoose.model('ChatRequest', chatRequestSchema);

export default ChatRequest;
