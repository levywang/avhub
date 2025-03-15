# -*- encoding: utf-8 -*-
import re
import json
import os
import asyncio
import aiohttp
from concurrent.futures import ThreadPoolExecutor
from bs4 import BeautifulSoup
from curl_cffi import requests
from omegaconf import DictConfig
from utils.logger import setup_logger
from typing import List, Set, Dict, Any
from aiohttp import ClientTimeout

class AVSpider:
    def __init__(self, av_code, source_url, proxy_url, use_proxy, cfg: DictConfig):
        self.source_url = source_url
        self.av_code = av_code.lower()
        self.proxy_url = proxy_url if use_proxy else None
        self.headers = {
            'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36',
            'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
            'Accept-Language': 'zh-CN,zh;q=0.9,en;q=0.8',
            'Accept-Encoding': 'gzip, deflate, br',
            'Connection': 'keep-alive',
            'Upgrade-Insecure-Requests': '1',
            'Sec-Fetch-Dest': 'document',
            'Sec-Fetch-Mode': 'navigate',
            'Sec-Fetch-Site': 'none',
            'Sec-Fetch-User': '?1',
        }
        self.proxies = {
            "http": self.proxy_url,
            "https": self.proxy_url
        } if self.proxy_url else {}
        self.logger = setup_logger(cfg)
        self.executor = ThreadPoolExecutor(max_workers=10)

    def _fetch_url(self, url: str) -> str:
        """使用curl_cffi获取URL内容"""
        try:
            response = requests.get(
                url, 
                proxies=self.proxies, 
                headers=self.headers,
                impersonate="chrome110",
                timeout=30
            )
            response.raise_for_status()
            return response.text
        except Exception as e:
            self.logger.error(f"Error fetching {url}: {str(e)}")
            return ""

    def _parse_video_page(self, html_content: str, code_str: str) -> Set[str]:
        """在线程池中解析视频页面"""
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            unique_links = set()
            for a_tag in soup.find_all('a'):
                alt_text = a_tag.get('alt')
                if alt_text and code_str in alt_text:
                    href = a_tag.get('href')
                    if href:
                        unique_links.add(href)
            return unique_links
        except Exception as e:
            self.logger.error(f"Error parsing video page: {str(e)}")
            return set()

    def _parse_magnet_page(self, html_content: str) -> List[List[str]]:
        """在线程池中解析磁力链接页面"""
        try:
            soup = BeautifulSoup(html_content, 'html.parser')
            target_table = soup.find('table', class_='min-w-full')
            result = []
            
            if target_table is not None:
                rows = target_table.find_all('tr')
                for row in rows:
                    cols = row.find_all('td')
                    data = []
                    for col in cols:
                        links = col.find_all('a', rel='nofollow')
                        if links:
                            for l in links:
                                href = l['href']
                                if "keepshare.org" not in href:
                                    data.append(href)
                        text = col.get_text(strip=True)
                        if text != "下载" and "keepshare.org" not in text:
                            data.append(text)
                    if data:
                        result.append(data)
            return result
        except Exception as e:
            self.logger.error(f"Error parsing magnet page: {str(e)}")
            return []

    async def get_video_url(self) -> List[str]:
        """获取视频页面的链接"""
        code_str = self.av_code.replace('-', '')
        match = re.match(r'([a-zA-Z]+)(\d+)', code_str)
        if not match:
            self.logger.error(f"Invalid AV code format: {self.av_code}")
            return []

        letters, digits = match.groups()
        code_str = f"{letters.lower()}-{digits}"
        url = f"{self.source_url}{code_str}"

        # 在线程池中执行同步请求
        loop = asyncio.get_event_loop()
        html_content = await loop.run_in_executor(self.executor, self._fetch_url, url)
        
        if not html_content:
            return []
        
        # 在线程池中解析HTML
        unique_links = await loop.run_in_executor(
            self.executor, 
            self._parse_video_page, 
            html_content, 
            code_str
        )
        
        self.logger.info(f"Found {len(unique_links)} video URLs")
        return list(unique_links)

    async def get_magnet_links(self, links: List[str]) -> List[List[str]]:
        """获取所有磁力链接"""
        loop = asyncio.get_event_loop()
        tasks = []
        
        # 创建所有获取页面内容的任务
        for link in links:
            task = loop.run_in_executor(self.executor, self._fetch_url, link)
            tasks.append(task)
        
        # 等待所有页面内容获取完成
        html_contents = await asyncio.gather(*tasks)
        
        # 在线程池中解析所有页面
        parse_tasks = [
            loop.run_in_executor(self.executor, self._parse_magnet_page, content)
            for content in html_contents if content
        ]
        results = await asyncio.gather(*parse_tasks)
        
        # 合并所有结果
        all_results = []
        for result in results:
            all_results.extend(result)
        
        self.logger.info(f"Found {len(all_results)} magnet links")
        return all_results

    async def process_av_code(self) -> List[List[str]]:
        """处理整个AV代码的主方法"""
        try:
            video_links = await self.get_video_url()
            if not video_links:
                return []
            
            magnet_links = await self.get_magnet_links(video_links)
            return magnet_links
        except Exception as e:
            self.logger.error(f"Error processing AV code {self.av_code}: {str(e)}")
            return []

    def __del__(self):
        """确保线程池被正确关闭"""
        self.executor.shutdown(wait=False)

class HacgSpider:
    def __init__(self, url, filepath, cfg: DictConfig):
        self.url = url
        self.filepath = filepath
        self.logger = setup_logger(cfg)

    def get_pages(self):
        try:
            response = requests.get(self.url)
            response.raise_for_status()
        except requests.RequestException as e:
            self.logger.error(f"Request Error: {e}")
            return None

        html_content = response.text

        soup = BeautifulSoup(html_content, 'html.parser')
        div_ele = soup.find('div', class_='wp-pagenavi')
        page_text = div_ele.get_text() if div_ele else ''

        pages = None
        if "共" in page_text:
            pages = int(page_text.split('共')[1].split('页')[0])

        self.logger.info(f"Total pages found: {pages}")

        return pages

    def get_links(self, page):
        url = f'{self.url}/wp/page/{page}?s=%E5%90%88%E9%9B%86&submit=%E6%90%9C%E7%B4%A2'
        try:
            response = requests.get(url)
            response.raise_for_status()
        except requests.RequestException as e:
            self.logger.error(f"Request Error: {e}")
            return {}

        html_content = response.text

        soup = BeautifulSoup(html_content, 'html.parser')
        links = {}
        for a_tag in soup.find_all('a'):
            href = a_tag.get('href')
            text = a_tag.get_text(strip=True)
            if "月合集" in text:
                links[text] = href

        magnet_links = {}
        for title, link in links.items():
            try:
                response = requests.get(link)
                response.raise_for_status()
            except requests.RequestException as e:
                self.logger.error(f"Request Error: {e}")
                continue

            content = response.text
            matches = re.findall(r'\b[a-f0-9]{40}\b', content)
            if matches:
                magnet_links[title] = f'magnet:?xt=urn:btih:{matches[0]}'

        self.logger.info(f"Magnet links extracted from page {page}")

        return magnet_links

    def update_json_file(self):
        if not os.path.exists(self.filepath) or os.path.getsize(self.filepath) == 0:
            results = {}
            total_pages = self.get_pages()
            if total_pages is None:
                self.logger.error("Unable to get total")
                return

            for i in range(1, total_pages + 1):
                new_data = self.get_links(i)
                results.update(new_data)
                self.logger.info(f'Page {i} processed (Full Update)')
        else:
            with open(self.filepath, 'r', encoding='utf-8') as file:
                results = json.load(file)

            total_pages = self.get_pages()
            if total_pages is None:
                self.logger.error("Unable to get total")
                return

            for i in range(1, total_pages + 1):
                new_data = self.get_links(i)
                all_exists = True

                for title, magnet_link in new_data.items():
                    if title not in results or results[title] != magnet_link:
                        all_exists = False
                        break

                if not all_exists:
                    results = {**new_data, **results}
                    self.logger.info(f'Page {i} processed (Incremental Update)')

                if all_exists:
                    self.logger.info(f"Page {i} data already exists in the JSON file, stop updating")
                    break

        with open(self.filepath, 'w', encoding='utf-8') as file:
            json.dump(results, file, ensure_ascii=False, indent=4)

        self.logger.info("JSON file updated")