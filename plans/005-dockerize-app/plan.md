# Plan: Container hoá app (FE+BE) vào docker-compose
**Based on:** specs/005-dockerize-app/spec.md | **Status:** Approved

## 1. Technical Approach
`Dockerfile` đơn giản (Node alpine, `npm ci --omit=dev`, copy `server.js` + `public/`, `CMD node server.js`). Thêm service `app` vào `docker-compose.yml` hiện có (`build: .`), dùng `depends_on.condition: service_healthy` với healthcheck `pg_isready` trên service `db`. `DATABASE_URL` cho service `app` override cứng trong `docker-compose.yml` (host = `db`), khác với giá trị trong `.env.example`/`.env` (host = `localhost`, dùng khi chạy `npm start` trực tiếp trên máy host).

## 2. Architecture Changes
- `Dockerfile` (mới).
- `.dockerignore` (mới) — loại `node_modules`, `.env`, `data`, `.git`.
- `docker-compose.yml` — thêm service `app` + `healthcheck` cho `db`.
- `README.md` — thêm hướng dẫn "Cách 1: tất cả qua Docker" và "Cách 2: Postgres qua Docker, app chạy trực tiếp" (giữ hướng dẫn cũ).

## 3. Component Design
**Dockerfile**
```dockerfile
FROM node:22-alpine
WORKDIR /app
COPY package.json package-lock.json ./
RUN npm ci --omit=dev
COPY server.js ./
COPY public ./public
EXPOSE 3000
CMD ["node", "server.js"]
```

**docker-compose.yml** (bổ sung)
```yaml
services:
  db:
    ...
    healthcheck:
      test: ["CMD-SHELL", "pg_isready -U hypnara -d hypnara"]
      interval: 5s
      timeout: 5s
      retries: 5

  app:
    build: .
    ports:
      - "3000:3000"
    environment:
      DATABASE_URL: postgres://hypnara:hypnara@db:5432/hypnara
      DEEPSEEK_API_KEY: ${DEEPSEEK_API_KEY}
      PORT: 3000
    depends_on:
      db:
        condition: service_healthy
```
`${DEEPSEEK_API_KEY}` được docker-compose tự đọc từ file `.env` ở cùng thư mục (cơ chế biến môi trường có sẵn của Compose, khác với hàm `loadEnv()` tự viết trong `server.js` — trong container không có file `.env`, biến môi trường được docker-compose set thẳng nên `loadEnv()` không cần chạy, code cũ đã tự bỏ qua nếu không thấy file).

## 4. Dependencies & Risks
- Không thêm dependency npm.
- Risk: người dùng chạy cả 2 cách cùng lúc (vd `app` container + `npm start` local) → đụng port `3000`. README ghi rõ chỉ chọn 1 trong 2.
- Risk: sửa code nhưng quên `--build` → chạy image cũ. Ghi rõ trong README.

## 5. Test Strategy
Verify tay: `docker-compose down` (dọn sạch), `docker-compose up --build` → curl `/api/me`, register/login/habits/suggest qua service `app`; dừng, chạy lại kiểu cũ (`docker-compose up -d db` + `npm start` trên host) để đảm bảo không bị hỏng.

## 6. Implementation Order
- Step 1: `Dockerfile` + `.dockerignore`.
- Step 2: `docker-compose.yml` — healthcheck cho `db`, thêm service `app`.
- Step 3: Verify tay cả 2 cách chạy.
- Step 4: Cập nhật README.
