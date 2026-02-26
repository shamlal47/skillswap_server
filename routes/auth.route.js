import { Router } from 'express';
import { register, login, resetpassword, forgetpassword, getMe } from '../controller/auth.controller.js';
import authorize from '../middleware/auth.middleware.js';

const authRouter = Router();

authRouter.post('/register', register);
authRouter.post('/login', login);
authRouter.post('/resetpassword', resetpassword);
authRouter.post('/forgetpassword', forgetpassword);
authRouter.get('/me', authorize, getMe);

export default authRouter;