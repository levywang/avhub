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
from contextlib import asynccontextmanager
import pathlib
import re
from concurrent.futures import ThreadPoolExecutor
import asyncio
from collections import Counter

@hydra.main(config_path='data/', config_name='config', version_base=None)
def main(cfg: DictConfig):
    # 初始化日志记录器
    global logger
    logger = setup_logger(cfg)

    @asynccontextmanager
    async def lifespan(app: FastAPI):
        # 启动前的操作
        logger.info("Application startup")
        yield
        # 关闭时的操作
        logger.info("Application shutdown")

    app = FastAPI(lifespan=lifespan)

    app.add_middleware(
        CORSMiddleware,
        allow_origins=cfg.app.cors_origins,
        allow_credentials=cfg.app.cors_credentials,
        allow_methods=cfg.app.cors_methods,
        allow_headers=cfg.app.cors_headers,
    )

    # 创建线程池
    executor = ThreadPoolExecutor(max_workers=10)

    def _fetch_url(url: str) -> str:
        """获取URL内容"""
        try:
            response = requests.get(url, timeout=10)  # 减少超时时间到10秒
            response.raise_for_status()
            return response.text
        except Exception as e:
            logger.error(f"Failed to fetch URL {url}: {str(e)}")
            return ""

    def _parse_html(html_content: str, image_dir_url: str) -> list:
        """解析HTML内容并提取链接"""
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            a_tags = soup.find_all('a', href=True)
            links = [image_dir_url + tag['href'] for tag in a_tags if tag['href'] != '../']
            return [link for link in links if link.endswith('.webp')] or links
        except Exception as e:
            logger.error(f"Failed to parse HTML: {str(e)}")
            return []

    async def get_image_url(video_url: str) -> str:
        """异步获取图片URL"""
        try:
            # 构建图片目录URL
            image_dir_url = video_url.replace('index.m3u8', 'image/')

            # 设置超时时间为15秒的Future
            loop = asyncio.get_event_loop()
            html_content = await asyncio.wait_for(
                loop.run_in_executor(executor, _fetch_url, image_dir_url),
                timeout=15
            )
            
            if not html_content:
                return None

            # HTML解析设置5秒超时
            links = await asyncio.wait_for(
                loop.run_in_executor(executor, _parse_html, html_content, image_dir_url),
                timeout=5
            )
            
            if not links:
                logger.warning("No image links found.")
                return None

            return random.choice(links)
        except asyncio.TimeoutError:
            logger.error(f"Timeout while processing image URL for {video_url}")
            return None
        except Exception as e:
            logger.error(f"Failed to obtain the image URL: {str(e)}")
            return None

    async def read_random_line(file_path: str) -> tuple[str, str]:
        """异步读取随机行并获取图片URL"""
        if not os.path.isfile(file_path):
            logger.error("File not found")
            raise HTTPException(status_code=404, detail="File not found")

        try:
            loop = asyncio.get_event_loop()
            # 文件读取设置2秒超时
            lines = await asyncio.wait_for(
                loop.run_in_executor(executor, lambda: open(file_path, 'r').readlines()),
                timeout=2
            )

            if not lines:
                logger.error("File is empty")
                raise HTTPException(status_code=400, detail="File is empty")

            random_line = random.choice(lines).strip()
            # 获取图片URL设置总超时20秒
            img_url = await asyncio.wait_for(get_image_url(random_line), timeout=20)

            return random_line, img_url
        except asyncio.TimeoutError:
            logger.error("Timeout while reading random line or fetching image URL")
            # 如果超时，返回视频URL但不返回图片URL
            return random.choice(lines).strip() if lines else None, None
        except Exception as e:
            logger.error(f"Error in read_random_line: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

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
        # 规范化code_str，只保留字母和数字
        code_str = re.sub(r'[^a-zA-Z0-9]', '', code_str).lower()
        
        # 如果启用了缓存，确保缓存目录存在并尝试从缓存读取
        if cfg.av_spider.use_cache:
            # 确保缓存目录存在
            pathlib.Path(cfg.av_spider.cache_dir).mkdir(parents=True, exist_ok=True)
            
            cache_path = os.path.join(cfg.av_spider.cache_dir, f"{code_str}.json")
            try:
                if os.path.exists(cache_path):
                    with open(cache_path, 'r', encoding='utf-8') as f:
                        cached_data = json.load(f)
                        logger.info(f"Cache hit for AV code: {code_str}")
                        return {"status": "succeed", "data": cached_data}
            except Exception as e:
                logger.error(f"Error reading cache file: {str(e)}")

        # 如果没有缓存或缓存读取失败，从网络获取
        crawler = AVSpider(av_code=code_str, 
                          source_url=cfg.av_spider.source_url, 
                          proxy_url=cfg.av_spider.proxy_url,
                          use_proxy=cfg.av_spider.use_proxy,
                          cfg=cfg)
        
        try:
            magnet_links = await crawler.process_av_code()
            
            if not magnet_links:
                logger.error(f"No magnet links found for AV code: {code_str}")
                raise HTTPException(status_code=404, detail="No magnet links found")

            # 准备数据
            magnet_data = [str(item) for item in magnet_links]

            # 如果启用了缓存，保存到缓存文件（只保存数据部分）
            if cfg.av_spider.use_cache:
                try:
                    with open(cache_path, 'w', encoding='utf-8') as f:
                        json.dump(magnet_data, f, ensure_ascii=False, indent=4)
                    logger.info(f"Cache written for AV code: {code_str}")
                except Exception as e:
                    logger.error(f"Error writing cache file: {str(e)}")

            logger.info(f"Magnet links found for AV code: {code_str}")
            return {"status": "succeed", "data": magnet_data}
        except Exception as e:
            logger.error(f"Error processing AV code {code_str}: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))
        finally:
            del crawler  # 确保资源被正确释放

    @app.get("/v1/get_video")
    async def get_random_video_url():
        """Returns a random video URL and its corresponding image URL."""
        try:
            file_path = cfg.files.video_urls_txt_path
            # 设置整体操作超时为25秒
            video_url, img_url = await asyncio.wait_for(
                read_random_line(file_path),
                timeout=25
            )
            
            if not video_url:
                raise HTTPException(status_code=500, detail="Failed to get video URL")
                
            logger.info("Random video URL and image URL fetched successfully")
            return {
                "url": video_url,
                "img_url": img_url or ""
            }
        except asyncio.TimeoutError:
            logger.error("Global timeout in get_random_video_url")
            raise HTTPException(status_code=504, detail="Request timeout")
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
    
    @app.get("/v1/hot_searches")
    async def get_hot_searches(top_n: int = 5, last_n_lines: int = 2000):
        """返回最热门的搜索词
        
        Args:
            top_n: 返回的热门搜索词数量，默认为5
            last_n_lines: 读取日志文件的最后行数，默认为1000行
        """
        try:
            # 参数基本验证
            if top_n < 1:
                top_n = 5
            if last_n_lines < 100:
                last_n_lines = 1000
                
            log_file_path = cfg.logging.log_file
            if not os.path.exists(log_file_path):
                logger.error(f"Log file does not exist: {log_file_path}")
                raise HTTPException(status_code=404, detail="Log file does not exist")
            
            # 使用线程池异步读取日志文件的最后N行
            def read_last_n_lines():
                encodings = ['utf-8', 'gbk', 'iso-8859-1']
                
                for encoding in encodings:
                    try:
                        with open(log_file_path, 'r', encoding=encoding) as f:
                            # 使用deque优化内存使用
                            from collections import deque
                            return deque(f, last_n_lines)
                    except UnicodeDecodeError:
                        continue
                    except Exception as e:
                        logger.error(f"Error reading log file with {encoding}: {str(e)}")
                        continue
                
                raise HTTPException(status_code=500, detail="Unable to read log file with any encoding")

            # 读取日志文件最后N行
            log_content = await asyncio.wait_for(
                asyncio.get_event_loop().run_in_executor(executor, read_last_n_lines),
                timeout=10
            )
            
            # 提取包含"AV code"但不包含"404"的行
            av_code_lines = [line for line in log_content if "AV code" in line and "404" not in line]
            
            # 从每行中提取代码
            search_terms = []
            for line in av_code_lines:
                try:
                    parts = line.split(":")
                    if len(parts) >= 2:
                        search_term = parts[-1].strip().lower()
                        # 规范化搜索词，只保留字母和数字
                        search_term = re.sub(r'[^a-zA-Z0-9]', '', search_term)
                        if search_term:
                            search_terms.append(search_term)
                except Exception as e:
                    logger.warning(f"Error processing line: {str(e)}")
                    continue
            
            if not search_terms:
                return {"status": "succeed", "data": []}
            
            # 统计每个搜索词的出现次数并获取前N名
            term_counts = Counter(search_terms)
            top_terms = [term for term, _ in term_counts.most_common(top_n)]
            
            logger.info(f"Retrieved top {top_n} popular search terms from last {last_n_lines} lines")
            return {"status": "succeed", "data": top_terms}
        except asyncio.TimeoutError:
            logger.error("Timeout while reading log file")
            raise HTTPException(status_code=504, detail="Request timeout")
        except Exception as e:
            logger.error(f"Failed to obtain popular search terms: {str(e)}")
            raise HTTPException(status_code=500, detail=str(e))

    import uvicorn
    uvicorn.run(app, host="0.0.0.0", port=8000)

if __name__ == "__main__":
    main()