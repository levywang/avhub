FROM python:3.13-slim

# 设置工作目录
WORKDIR /app

# 安装依赖
RUN apt-get update && apt-get install -y --no-install-recommends nginx
RUN pip install  --no-cache-dir beautifulsoup4 fastapi requests uvicorn hydra-core curl_cffi schedule

# 复制应用代码
COPY . /app
RUN rm -rf /etc/nginx/sites-enabled/default && cp /app/nginx.example.conf /etc/nginx/sites-enabled/default

CMD ["sh", "-c", "python3 main.py & nginx -g 'daemon off;'"]

EXPOSE 8998
EXPOSE 8000
