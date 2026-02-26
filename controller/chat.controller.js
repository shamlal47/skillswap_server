import ChatRequest from "../model/chatRequest.model.js";
import Message from "../model/message.model.js";
import User from "../model/user.model.js";
import Course from "../model/course.model.js";

// Send a chat request for a matched course
export const sendChatRequest = async (req, res, next) => {
    try {
        const senderId = req.user?.id || req.user?._id;
        const { receiverId, courseId, message } = req.body;

        if (!receiverId || !courseId) {
            return res.status(400).json({
                success: false,
                message: "Receiver ID and Course ID are required"
            });
        }

        // Check if the course exists
        const course = await Course.findById(courseId);
        if (!course) {
            return res.status(404).json({ success: false, message: "Course not found" });
        }

        // Check if receiver exists
        const receiver = await User.findById(receiverId);
        if (!receiver) {
            return res.status(404).json({ success: false, message: "User not found" });
        }

        // Check if request already exists
        const existingRequest = await ChatRequest.findOne({
            sender: senderId,
            receiver: receiverId,
            course: courseId
        });

        if (existingRequest) {
            return res.status(400).json({
                success: false,
                message: "Chat request already sent",
                request: existingRequest
            });
        }

        const chatRequest = await ChatRequest.create({
            sender: senderId,
            receiver: receiverId,
            course: courseId,
            message: message || `I'd like to learn about ${course.title}`
        });

        const populatedRequest = await ChatRequest.findById(chatRequest._id)
            .populate('sender', 'name profilePicture')
            .populate('receiver', 'name profilePicture')
            .populate('course', 'title requiredSkill');

        res.status(201).json({
            success: true,
            message: "Chat request sent successfully",
            request: populatedRequest
        });
    } catch (error) {
        next(error);
    }
};

// Get pending requests received by the user
export const getPendingRequests = async (req, res, next) => {
    try {
        const userId = req.user?.id || req.user?._id;

        const requests = await ChatRequest.find({
            receiver: userId,
            status: 'pending'
        })
            .populate('sender', 'name profilePicture email')
            .populate('course', 'title requiredSkill thumbnail')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            requests
        });
    } catch (error) {
        next(error);
    }
};

// Get sent requests by the user
export const getSentRequests = async (req, res, next) => {
    try {
        const userId = req.user?.id || req.user?._id;

        const requests = await ChatRequest.find({
            sender: userId
        })
            .populate('receiver', 'name profilePicture email')
            .populate('course', 'title requiredSkill thumbnail')
            .sort({ createdAt: -1 });

        res.status(200).json({
            success: true,
            requests
        });
    } catch (error) {
        next(error);
    }
};

// Accept or reject a chat request
export const respondToRequest = async (req, res, next) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const { requestId, action } = req.body;

        if (!requestId || !['accept', 'reject'].includes(action)) {
            return res.status(400).json({
                success: false,
                message: "Request ID and valid action (accept/reject) are required"
            });
        }

        const chatRequest = await ChatRequest.findById(requestId);

        if (!chatRequest) {
            return res.status(404).json({ success: false, message: "Request not found" });
        }

        // Only the receiver can respond
        if (chatRequest.receiver.toString() !== userId) {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }

        chatRequest.status = action === 'accept' ? 'accepted' : 'rejected';
        await chatRequest.save();

        const populatedRequest = await ChatRequest.findById(chatRequest._id)
            .populate('sender', 'name profilePicture email')
            .populate('receiver', 'name profilePicture email')
            .populate('course', 'title requiredSkill');

        res.status(200).json({
            success: true,
            message: `Request ${action}ed successfully`,
            request: populatedRequest
        });
    } catch (error) {
        next(error);
    }
};

// Get accepted chats (active conversations)
export const getAcceptedChats = async (req, res, next) => {
    try {
        const userId = req.user?.id || req.user?._id;

        const chats = await ChatRequest.find({
            status: 'accepted',
            $or: [{ sender: userId }, { receiver: userId }]
        })
            .populate('sender', 'name profilePicture email')
            .populate('receiver', 'name profilePicture email')
            .populate('course', 'title requiredSkill thumbnail')
            .sort({ updatedAt: -1 });

        res.status(200).json({
            success: true,
            chats
        });
    } catch (error) {
        next(error);
    }
};

// Get messages for a specific chat
export const getMessages = async (req, res, next) => {
    try {
        const userId = req.user?.id || req.user?._id;
        const { chatRequestId } = req.params;

        // Verify user is part of this chat
        const chatRequest = await ChatRequest.findById(chatRequestId);
        if (!chatRequest) {
            return res.status(404).json({ success: false, message: "Chat not found" });
        }

        if (chatRequest.sender.toString() !== userId && chatRequest.receiver.toString() !== userId) {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }

        if (chatRequest.status !== 'accepted') {
            return res.status(400).json({ success: false, message: "Chat is not active" });
        }

        const messages = await Message.find({ chatRequest: chatRequestId })
            .populate('sender', 'name profilePicture')
            .sort({ createdAt: 1 });

        // Mark messages as read
        await Message.updateMany(
            { chatRequest: chatRequestId, sender: { $ne: userId }, read: false },
            { read: true }
        );

        res.status(200).json({
            success: true,
            messages
        });
    } catch (error) {
        next(error);
    }
};

// Send a message (used via REST, Socket.io handles real-time)
export const sendMessage = async (req, res, next) => {
    try {
        const senderId = req.user?.id || req.user?._id;
        const { chatRequestId, content } = req.body;

        if (!chatRequestId || !content) {
            return res.status(400).json({
                success: false,
                message: "Chat ID and content are required"
            });
        }

        // Verify chat exists and is accepted
        const chatRequest = await ChatRequest.findById(chatRequestId);
        if (!chatRequest) {
            return res.status(404).json({ success: false, message: "Chat not found" });
        }

        if (chatRequest.status !== 'accepted') {
            return res.status(400).json({ success: false, message: "Chat is not active" });
        }

        if (chatRequest.sender.toString() !== senderId && chatRequest.receiver.toString() !== senderId) {
            return res.status(403).json({ success: false, message: "Not authorized" });
        }

        const message = await Message.create({
            chatRequest: chatRequestId,
            sender: senderId,
            content
        });

        const populatedMessage = await Message.findById(message._id)
            .populate('sender', 'name profilePicture');

        res.status(201).json({
            success: true,
            message: populatedMessage
        });
    } catch (error) {
        next(error);
    }
};
