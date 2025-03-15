FROM python:3.13-slim

# 设置工作目录
WORKDIR /app
COPY . /app

# 安装依赖
RUN apt-get update && apt-get install -y --no-install-recommends nginx
RUN pip3 install -r requirements.txt

# 修改Nginx配置
RUN rm -rf /etc/nginx/sites-enabled/default && cp /app/nginx.example.conf /etc/nginx/sites-enabled/default

CMD ["sh", "-c", "python3 main.py & nginx -g 'daemon off;'"]

EXPOSE 80
EXPOSE 8000