const jwt = require('jsonwebtoken')
const logger = require('../utils/logger');

const JWT_SECRET = process.env.JWT_SECRET || 'hdtmovie_secret_key_123';

exports.verifyToken = (req,res,next) => {
    const authHeader = req.headers.authorization;
    const token = authHeader && authHeader.split('')[1];
    if (!token) {
        return res.status(401).json({
            success: false,
            message: 'Truy cập bị từ chối!'
        })
    }
    try {
        const decoded = jwt.verify(token,JWT_SECRET);
        req.user = decoded;
        next();
    } catch (err) {
        return res.status(403).json({
            success: false,
            message: 'Token không hợp lệ với người dùng'
        })
    }
};
exports.isAdmin = (req,res,next) => { 
    if (req.user && req.user.role === 'admin') {
        next();
    } else {
        res.status(403).json({success: false, message: 'Bạn không có quyền quản trị hệ thống này'})
    }
}