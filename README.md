# Japan Travel Planner API + Frontend

## Environment Variables
- You can copy `frontend/.env.example` and `backend/.env.example` to local `.env` files as templates.


### Backend (`backend`)
- `APP_CORS_ALLOWED_ORIGIN` (default: `http://localhost:5173`)
- `SPRING_DATASOURCE_URL` (required in local run)
- `SPRING_DATASOURCE_USERNAME` (required in local run)
- `SPRING_DATASOURCE_PASSWORD` (required in local run)

### Frontend (`frontend`)
- `VITE_API_BASE_URL` (default: `http://localhost:8080`)

## Local Run

### 1) Start DB container
```bash
docker start japan-planner-db
```

### 2) Start backend
```bash
cd backend

DB_PORT=$(docker port japan-planner-db 5432 | awk -F: '{print $2}')

SPRING_DATASOURCE_URL="jdbc:postgresql://127.0.0.1:${DB_PORT}/japan_planner" \
SPRING_DATASOURCE_USERNAME="planner" \
SPRING_DATASOURCE_PASSWORD="planner" \
./mvnw spring-boot:run
```
### 3) Start frontend
```bash
cd frontend
npm run dev
```

