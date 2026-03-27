# HTDMOVIE

HTDMOVIE la du an web dat ve xem phim gom backend Node.js/Express, frontend React/Vite, PostgreSQL va Redis. Du an duoc to chuc theo huong tach rieng frontend, backend va database script de de phat trien va deploy.

## Cong nghe su dung

- Frontend: React, Vite, React Router, Tailwind CSS
- Backend: Node.js, Express, JWT, Swagger
- Database: PostgreSQL
- Cache/queue support: Redis
- Container: Docker, Docker Compose

## Cau truc thu muc

```text
HTDMOVIE/
|-- backend/                 # API, middleware, business modules
|   |-- database/            # SQL khoi tao bang, transaction, trigger, view
|   |-- src/
|   |   |-- config/
|   |   |-- modules/
|   |   |-- cron/
|   |   `-- server.js
|-- database/                # Them SQL scripts dung rieng o muc goc
|-- htdmovie-frontend/       # Giao dien React/Vite
|-- docker-compose.yml       # Chay full stack bang container
`-- README.md
```

## Tinh nang chinh

- Xac thuc nguoi dung voi JWT
- Quan ly phim, ghe, lich chieu va dat ve
- API thanh toan
- Khu vuc quan tri
- Goi y phim
- Tai lieu API qua Swagger tai `/api-docs`

## Chay du an bang Docker

Yeu cau:

- Da cai Docker
- Da cai Docker Compose

Chay:

```bash
docker compose up --build
```

Sau khi khoi dong:

- Frontend: `http://localhost:8081`
- Backend API: `http://localhost:5000`
- Swagger: `http://localhost:5000/api-docs`
- PostgreSQL: `localhost:5432`
- Redis: `localhost:6379`
- pgAdmin: `http://localhost:5050`

Tai khoan pgAdmin trong `docker-compose.yml`:

- Email: `admin@admin.com`
- Password: `admin`

## Chay thu cong khong dung Docker

### 1. Backend

```bash
cd backend
npm install
npm run dev
```

Can cau hinh file `.env` voi cac bien toi thieu:

```env
PORT=3004
NODE_ENV=development
DB_HOST=localhost
DB_PORT=5432
DB_USER=your_user
DB_PASSWORD=your_password
DB_NAME=HTDMOVIE
JWT_SECRET=your_jwt_secret
JWT_EXPIRES_IN=1d
JWT_REFRESH_SECRET=your_refresh_secret
CLIENT_URL=http://localhost:5173
REACT_APP_API_URL=http://localhost:3004
REDIS_HOST=localhost
REDIS_PORT=6379
```

### 2. Frontend

```bash
cd htdmovie-frontend
npm install
npm run dev
```

Mac dinh Vite se chay tai `http://localhost:5173`.

## Database

SQL scripts dang co trong:

- `backend/database/01_entities.sql`
- `backend/database/02_transactions.sql`
- `backend/database/init_triggers.sql`
- `backend/database/view.sql`

Neu chay bang Docker, PostgreSQL se tu dong nap cac script trong `backend/database/` khi container database duoc tao moi.

## API va module backend

Mot so nhom module chinh trong `backend/src/modules/`:

- `auth`
- `movies`
- `booking`
- `payment`
- `admin`
- `recommend`
- `seats`
- `showtimes`

Backend entry point nam tai `backend/src/server.js`.

## Ghi chu

- Khong nen day file `.env` that len GitHub.
- Thu muc `node_modules/` da duoc bo qua boi `.gitignore`.
- Neu database da ton tai volume cu, co the can xoa volume Docker de chay lai script khoi tao tu dau.

