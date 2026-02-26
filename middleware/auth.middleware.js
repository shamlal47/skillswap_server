import jwt from 'jsonwebtoken';
import User from '../model/user.model.js';
import { JWT_SECRET } from '../config/env.js';

const authorize = async (req, res, next) => {
    try {
        let token;

        // Authorization header: 'Bearer <token>'
        if (req.headers.authorization && req.headers.authorization.startsWith('Bearer ')) {
            token = req.headers.authorization.split(' ')[1];
        }

        // Fallback to cookie named 'token'
        else if (req.cookies && req.cookies.token) {
            token = req.cookies.token;
        }

        if (!token) {
            return res.status(401).json({ success: false, message: 'No token, authorization denied' });
        }

        const decoded = jwt.verify(token, JWT_SECRET);
        const user = await User.findById(decoded.id).select('-password');
        if (!user) {
            return res.status(401).json({ success: false, message: 'Unauthorized' });
        }

        req.user = user;
        return next();
    } catch (error) {
        return next(error);
    }
};

export default authorize;