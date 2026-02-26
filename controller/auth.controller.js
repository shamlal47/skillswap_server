import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import User from '../model/user.model.js';
import { JWT_SECRET } from '../config/env.js';

export const register = async (req, res, next) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ success: false, error: 'Request body is missing or empty' });
    }

    const { name, email, password } = req.body;

    try {
        const userExists = await User.findOne({ email });
        if (userExists) {
            return res.status(400).json({ success: false, message: 'User already exists' });
        }

        const hashedPassword = await bcrypt.hash(password, 10);

        const user = await User.create({
            name,
            email,
            password: hashedPassword
        });

        if (!user || !user._id) {
            return res.status(500).json({ success: false, error: 'Failed to create user' });
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET, {
            expiresIn: '1h'
        });

        res.status(201).json({
            success: true,
            token
        });
    } catch (error) {
        next(error);
    }
}

export const login = async (req, res, next) => {
    if (!req.body || Object.keys(req.body).length === 0) {
        return res.status(400).json({ success: false, error: 'Request body is missing or empty' });
    }

    const { email, password } = req.body;

    try {
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Invalid credentials' });
        }
    
        if (!user._id) {
            return res.status(500).json({ success: false, error: 'Invalid user record' });
        }

        const token = jwt.sign({ id: user._id }, JWT_SECRET, {
            expiresIn: '1h'
        });

        res.status(200).json({
            success: true,
            message: 'Login successful',
            token
        });
    } catch (error) {
        next(error);
    }
}

export const logout = (req, res) => {
    // For JWT, logout is handled on the client side by deleting the token.
    res.status(200).json({ success: true, message: 'Logged out successfully' });
}

export const getMe = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const userId = req.user.id || req.user._id;
    try {
        const user = await User.findById(userId).select('-password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }
        res.status(200).json({ success: true, data: user });
    } catch (error) {
        next(error);
    }
}

export const resetpassword = async (req, res, next) => {
    if (!req.user) {
        return res.status(401).json({ success: false, message: 'Unauthorized' });
    }
    
    const userId = req.user.id || req.user._id;
    const { oldPassword, newPassword } = req.body || {};

    try {
        const user = await User.findById(userId).select('+password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        const isMatch = await bcrypt.compare(oldPassword, user.password);
        if (!isMatch) {
            return res.status(400).json({ success: false, message: 'Old password is incorrect' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        next(error);
    }
}

export const forgetpassword = async (req, res, next) => {
    const { email, newPassword } = req.body || {};
    
    try {
        const user = await User.findOne({ email }).select('+password');
        if (!user) {
            return res.status(404).json({ success: false, message: 'User not found' });
        }

        user.password = await bcrypt.hash(newPassword, 10);
        await user.save();

        res.status(200).json({ success: true, message: 'Password reset successful' });
    } catch (error) {
        next(error);
    }
}