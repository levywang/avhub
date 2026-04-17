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

EXPOSE 8000
CMD ["python3", "main.py"]
