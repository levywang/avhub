# Stage 1: Build frontend
FROM node:20-slim AS frontend
WORKDIR /web
COPY web/package*.json ./
RUN npm ci
COPY web/ ./
RUN npm run build

# Stage 2: Python backend
FROM python:3.13-slim
WORKDIR /app
COPY . /app
COPY --from=frontend /web/dist /app/web/dist
RUN pip3 install --no-cache-dir -r requirements.txt

# AV Spider
ENV AV_SOURCE_URL="https://missav.ai/cn/search/"
ENV PROXY_URL="http://127.0.0.1:7890"
ENV USE_PROXY=false
ENV USE_CACHE=true
ENV CACHE_DIR="/app/data/.av"

# HACG Spider
ENV HACG_SOURCE_URL="https://www.hacg.mov"

# Auth
ENV AUTH_ENABLED=false
ENV API_KEY="123456

EXPOSE 8000
CMD ["python3", "main.py"]
