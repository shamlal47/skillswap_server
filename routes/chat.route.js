import { Router } from "express";
import {
    sendChatRequest,
    getPendingRequests,
    getSentRequests,
    respondToRequest,
    getAcceptedChats,
    getMessages,
    sendMessage
} from "../controller/chat.controller.js";
import authorize from "../middleware/auth.middleware.js";

const chatRouter = Router();

// Chat request endpoints
chatRouter.post('/request', authorize, sendChatRequest);
chatRouter.get('/requests/pending', authorize, getPendingRequests);
chatRouter.get('/requests/sent', authorize, getSentRequests);
chatRouter.post('/request/respond', authorize, respondToRequest);

// Active chats
chatRouter.get('/chats', authorize, getAcceptedChats);
chatRouter.get('/chats/:chatRequestId/messages', authorize, getMessages);
chatRouter.post('/message', authorize, sendMessage);

export default chatRouter;
