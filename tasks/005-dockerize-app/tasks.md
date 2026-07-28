# Tasks: Container hoá app (FE+BE) vào docker-compose
**Based on:** plans/005-dockerize-app/plan.md

### Phase 1: Docker build
- [x] 🟢 1.1 `Dockerfile`
- [x] 🟢 1.2 `.dockerignore`

### Phase 2: Compose
- [x] 🟢 2.1 Healthcheck cho service `db`
- [x] 🟢 2.2 Service `app` (build, port, env, depends_on healthy)

### Phase 3: Verify & docs
- [x] 🟢 3.1 Verify `docker-compose up --build` (curl toàn luồng qua container)
- [x] 🟢 3.2 Verify cách chạy cũ vẫn hoạt động (`docker-compose up -d db` + `npm start` host)
- [x] 🟢 3.3 Cập nhật README (2 cách chạy)
