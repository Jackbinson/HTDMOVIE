const swaggerJsdoc = require('swagger-jsdoc');

const options = {
  definition: {
    openapi: '3.0.0', // Chuẩn OpenAPI 3.0
    info: {
      title: 'HTD Movie API Documentation',
      version: '1.0.0',
      description: 'Tài liệu API cho dự án đặt vé xem phim HTD Movie',
      contact: {
        name: 'Jack Dev',
        email: 'jack@example.com',
      },
    },
    servers: [
      {
        url: 'http://localhost:3000/api', // Đường dẫn gốc của API
        description: 'Local Development Server',
      },
    ],
    components: {
      securitySchemes: {
        bearerAuth: {
          type: 'http',
          scheme: 'bearer',
          bearerFormat: 'JWT',
        },
      },
    },
    security: [
      {
        bearerAuth: [], // Áp dụng khóa bảo mật cho toàn bộ API (tùy chọn)
      },
    ],
  },
  // Đường dẫn tới các file chứa comment tài liệu (QUAN TRỌNG)
apis: ['./src/modules/**/*.routes.js', './src/modules/**/*.yaml'],
};

const swaggerSpec = swaggerJsdoc(options);

module.exports = swaggerSpec;