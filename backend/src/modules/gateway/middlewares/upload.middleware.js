const multer = require('multer');
const path = require('path');
const fs = require('fs');
// Cấu hình đường dẫn tuyệt đối 
// process .cwd() trả về thư mục gốc của dự án 
const uploadDir = path.join(__dirname, '../../../../uploads');
console.log('Upload directory:', uploadDir);

if (!fs.existsSync(uploadDir)) {
    try {
      fs.mkdirSync(uploadDir, { recursive: true});
      console.log('Upload directory created successfully');
    } catch (err) {
      console.error('Error creating upload directory:', err);
    }
}

// Cấu hình nơi lưu và tên file
const storage = multer.diskStorage({
  destination: function (req, file, cb) {
    // 3. Sử dụng biến uploadDir (đường dẫn tuyệt đối) thay vì chuỗi 'uploads/'
    cb(null, uploadDir); 
  },
  filename: function (req, file, cb) {
    // Đặt tên file: timestamp + số ngẫu nhiên + đuôi file
    // Ví dụ: 170660232123-832910.jpg
    const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
    cb(null, uniqueSuffix + path.extname(file.originalname));
  }
});

// Bộ lọc chỉ cho phép ảnh
const fileFilter = (req, file, cb) => {
  if (file.mimetype.startsWith('image/')) {
    cb(null, true);
  } else {
    cb(new Error('Chỉ được upload file ảnh!'), false);
  }
};

const upload = multer({ 
  storage: storage,
  limits: { fileSize: 5 * 1024 * 1024 }, // Giới hạn 5MB
  fileFilter: fileFilter
});

module.exports = upload;