# CreditTN

CreditTN is a full-stack Buy Now, Pay Later platform for Tunisia. The workspace contains:

- `creadiTn`: Spring Boot backend API on port `8082`.
- `Dashboard_client-main`: Next.js landing page, client dashboard, and admin dashboard on port `3000`.
- `frontend mobile`: Expo React Native mobile app.
- `socket-server`: Socket.IO relay on port `3001`.
- `scripts/db`: database reset scripts, security migrations, and the Docker seed dump.

For the full audit, architecture, database notes, API reference, and runbook, see `PROJECT_DOCUMENTATION.md`.

## Run With Docker

```bash
cp .env.example .env
docker compose up --build
```

Local URLs:

- Dashboard: `http://localhost:3000`
- Backend API: `http://localhost:8082`
- Swagger UI: `http://localhost:8082/swagger-ui.html`
- phpMyAdmin for the Docker MySQL database: `http://localhost:8081`
- Socket server health: `http://localhost:3001/health`

The MySQL seed file is `scripts/db/initial-data.sql` and is mounted by Docker as `/docker-entrypoint-initdb.d/01-initial-data.sql`.
Use `http://localhost:8081`, not `http://localhost/phpmyadmin`; port 80 may belong to a local XAMPP/WAMP phpMyAdmin instance and will not show the Docker `creaditn` database.

## Local Checks

```bash
cd creadiTn
.\mvnw.cmd test

cd ..\Dashboard_client-main
npm.cmd run lint
npm.cmd run build

cd "..\frontend mobile"
npm.cmd run lint
npm.cmd test
npm.cmd run build
```
"# creaditnproject" 
