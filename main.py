# -*- encoding: utf-8 -*-
import os
import requests
import json
from bs4 import BeautifulSoup
from typing import Union
from fastapi import FastAPI
from fastapi.responses import JSONResponse
from fastapi.middleware.cors import CORSMiddleware
from fastapi import FastAPI, HTTPException
import random
from utils.spider import *
import hydra
from utils.logger import setup_logger
import schedule
import time

@hydra.main(config_path='data/', config_name='config', version_base=None)
def main(cfg: DictConfig):
    # 初始化日志记录器
    logger = setup_logger(cfg)

    app = FastAPI()

    @app.on_event("startup")
    async def startup_event():
        global logger
        logger = setup_logger(cfg)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=cfg.app.cors_origins,
        allow_credentials=cfg.app.cors_credentials,
        allow_methods=cfg.app.cors_methods,
        allow_headers=cfg.app.cors_headers,
    )

    def get_image_url(video_url: str) -> str:
        try:
            # 构建图片目录URL
            image_dir_url = video_url.replace('index.m3u8', 'image/')

            # 发送请求获取目录内容
            response = requests.get(image_dir_url, timeout=20)  # 设置超时时间防止长时间等待
            response.raise_for_status()  # 如果响应状态码不是200，抛出HTTPError

            # 解析HTML并提取链接
            soup = BeautifulSoup(response.text, 'html.parser')
            a_tags = soup.find_all('a', href=True)  # 只查找有href属性的<a>标签

            # 分离出.webp和其他格式链接，并排除上级目录链接
            links = [image_dir_url + tag['href'] for tag in a_tags if tag['href'] != '../']
            webp_links = [link for link in links if link.endswith('.webp')]

            # 优先返回.webp链接，如果没有则从其他链接中随机返回
            if not links:
                logger.warning("No image links found.")
                return None
            return random.choice(webp_links or links)
        except Exception as e:
            logger.error(f"Failed to obtain the image URL: {str(e)}")
            return None

    def read_random_line(file_path: str) -> tuple[str, str]:
        """Reads a random line from a given file and returns video URL and image URL."""
        if not os.path.isfile(file_path):
            logger.error("File not found")
            raise HTTPException(status_code=404, detail="File not found")

        with open(file_path, 'r') as file:
            lines = file.readlines()

        if not lines:
            logger.error("File is empty")
            raise HTTPException(status_code=400, detail="File is empty")

        random_line = random.choice(lines).strip()
        img_url = get_image_url(random_line)

        return random_line, img_url

    @app.get("/v1/hacg")
    async def read_hacg():
        try:
            with open(cfg.files.hacg_json_path, 'r', encoding='utf-8') as file:
                data = json.load(file)
            logger.info("HACG data fetched successfully")
            return JSONResponse({"data": data}, headers={'content-type': 'application/json;charset=utf-8'})
        except Exception as e:
            logger.error(f"Failed to fetch HACG data: {str(e)}")
            raise HTTPException(status_code=500, detail="Internal Server Error")

    @app.get("/v1/avcode/{code_str}")
    async def crawl_av(code_str: str):
        crawler = AVSpider(av_code=code_str, 
                           source_url=cfg.av_spider.source_url, 
                           proxy_url=cfg.av_spider.proxy_url,
                           use_proxy=cfg.av_spider.use_proxy,
                           cfg=cfg)
        video_links = crawler.get_video_url()
        all_magnet_links = []

        for link in video_links:
            magnet_links = crawler.get_magnet_links(link)
            all_magnet_links.extend(magnet_links)

        if not all_magnet_links:
            logger.error("No magnet links found for AV code: %s", code_str)
            raise HTTPException(status_code=404, detail="No magnet links found")

        logger.info("Magnet links found for AV code: %s", code_str)
        return {"status": "succeed", "data": [str(item) for item in all_magnet_links]}

    @app.get("/v1/get_video")
    async def get_random_video_url():
        """Returns a random video URL and its corresponding image URL."""
        try:
            file_path = cfg.files.video_urls_txt_path
            video_url, img_url = read_random_line(file_path)
            logger.info("Random video URL and image URL fetched successfully")
            return {
                "url": video_url,
                "img_url": img_url or ""
            }
        except Exception as e:
            logger.error(f"Failed to fetch random video URL: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
        
    def run_hacg_spider():
        hacg_spider = HacgSpider(url=cfg.hacg_spider.source_url, filepath=cfg.files.hacg_json_path, cfg=cfg)
        hacg_spider.update_json_file()
        logger.info("HacgSpider task completed.")

    # Schedule the HacgSpider task to run daily at 1 AM
    schedule.every().day.at("01:00").do(run_hacg_spider)

    # Function to keep running the scheduler in the background
    def run_scheduler():
        while True:
            schedule.run_pending()
            time.sleep(60)  # Check every minute

    import threading
    # Start the scheduler in a separate thread
    scheduler_thread = threading.Thread(target=run_scheduler)
    scheduler_thread.daemon = True
    scheduler_thread.start()

    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    main()