// Hàm này nhận vào danh sách các quyền được phép (Vd: ['admin', 'staff'])
const authorize = (allowedRoles = []) => {
    return (req, res, next) => {
        console.log('--- CHECK QUYỀN (Role Middleware) ---');
        console.log('1. User Role hiện tại:', req.user ? req.user.role : 'Chưa đăng nhập');
        console.log('2. Quyền yêu cầu:', allowedRoles);

        // 1. Kiểm tra nếu chưa đăng nhập (hoặc authMiddleware chưa chạy)
        if (!req.user) {
            return res.status(401).json({ message: 'Chưa xác thực danh tính (No User Found)!' });
        }

        // 2. Kiểm tra Role có nằm trong danh sách cho phép không
        if (allowedRoles.includes(req.user.role)) {
            console.log('DUYỆT: Hợp lệ');
            next(); // Cho qua
        } else {
            console.log('CHẶN: Sai quyền');
            res.status(403).json({ 
                message: `Truy cập bị từ chối! Bạn là '${req.user.role}', nhưng chức năng này cần quyền: ${allowedRoles.join(' hoặc ')}` 
            });
        }
    };
};

module.exports = authorize;