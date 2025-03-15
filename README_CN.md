<div align="center">
      <img src="web\imgs\logo_opaque.png" alt="FTP Web Client Logo">
</div>

# AvHub -  R18 资源搜索和管理工具

**AvHub** 是一个致力于检索和管理成人视频资源的 Web 平台

Cloudflare Page: https://avhub.pages.dev/  
  
Vercel Page: https://avhub.vercel.app/

****

[![GitHub license](https://img.shields.io/github/license/levywang/avhub?label=License&logo=github)](https://github.com/levywang/avhub "Click to view the repo on Github")
[![Release Version](https://img.shields.io/github/release/levywang/avhub?include_prereleases&label=Release&logo=github)](https://github.com/levywang/avhub/releases/latest "Click to view the repo on Github")
[![GitHub Star](https://img.shields.io/github/stars/levywang/avhub?label=Stars&logo=github)](https://github.com/levywang/avhub "Click to view the repo on Github")
[![GitHub Fork](https://img.shields.io/github/forks/levywang/avhub?label=Forks&logo=github)](https://github.com/levywang/avhub/forks?include=active%2Carchived%2Cinactive%2Cnetwork&page=1&period=2y&sort_by=stargazer_counts "Click to view the repo on Github")
[![Repo Size](https://img.shields.io/github/repo-size/levywang/avhub?label=Size&logo=github)](https://github.com/levywang/avhub "Click to view the repo on Github")
[![GitHub Issue](https://img.shields.io/github/issues-closed-raw/levywang/avhub?label=Closed%20Issue&logo=github)](https://github.com/levywang/avhub/issues?q=is%3Aissue+is%3Aclosed "Click to view the repo on Github")

[![Docker Stars](https://img.shields.io/docker/stars/levywang/avhub?label=Stars&logo=docker)](https://hub.docker.com/r/levywang/avhub "Click to view the image on Docker Hub")
[![Docker Pulls](https://img.shields.io/docker/pulls/levywang/avhub?label=Pulls&logo=docker)](https://hub.docker.com/r/levywang/avhub "Click to view the image on Docker Hub")
  
    
## Star History

[![Star History Chart](https://api.star-history.com/svg?repos=levywang/avhub&type=Date)](https://star-history.com/#levywang/avhub&Date)  

[English](README.md) | [简体中文](README_CN.md) 

---

### **核心特性**  
● 🔗 **番号磁力链搜索**  
  &emsp;精准查找番号对应的磁力链接和封面图  
● 📅 **里番资源定时内容更新追踪**  
  &emsp;自动更新并归档月度里番资源  
● 📊 **随机视频推荐**  
  &emsp;基于爬虫数据的随机播放功能  
● 🌐 **多语言支持**  
  &emsp;支持多种语言界面，满足全球用户需求  
● 🎨 **多种主题配色切换**  
  &emsp;提供多种主题配色，提升用户体验  

---

## Getting Started

### 本地运行
```bash
git clone https://github.com/levywang/avhub.git
cd avhub
pip install -r requirements.txt
python main.py
```
默认运行的API地址：`http://127.0.0.1:8000/`

可以配置反代和域名，替换 `web/script.js` 38行中的 `BASE_URL`

后端运行的配置文件在 `data/config.yaml` 中，请根据实际情况修改


### Docker 部署
**注意：Python Version >= 3.7**
```bash
git clone https://github.com/levywang/avhub.git
cd avhub
docker run -d -p <your_server_port>:80 -v $PWD:/app --name avhub levywang/avhub:latest
```
---

### 配置说明

如果您将项目部署在中国境内的服务器上，由于源站 `missav` 被屏蔽，需要在 `config.yaml` 中配置代理服务器。请编辑 `/data/config.yaml` 文件，修改示例如下：  
```yaml
av_spider:
  source_url: "https://missav.ai/cn/search/"
  proxy_url: "http://192.168.50.3:7890" # HTTP 或 SOCKS5 代理
  use_proxy: true
```

---

### **技术栈**  
- **前端**：  
  - 使用 **Tailwind CSS** 构建现代化、响应式界面。  
  - 集成 **hls.js** 实现流畅的视频播放体验。  
- **后端**：  
  - 基于 **Python** 的 **FastAPI** 框架开发，提供高效、稳定的 API 服务。  
- **隐私保护**：  
  - 严格遵循隐私保护原则，不直接托管任何资源文件，所有数据均通过第三方链接获取。  

---

### **数据源**
- **番号磁力链和封面图**：来源于 **missav** 
- **里番资源**：来源于 **hacg 琉璃神社**
- **随机视频推荐**：来源于到的爬虫数据，存储在本地文件 `/data/video_urls.txt`

以上数据源均配置在 `data/config.yaml` 中，如果数据源变更或者无法访问，需要进行修改和维护


---

### **法律声明**  
用户需自行遵守所在地区相关法律法规。AvHub 仅为资源检索工具，不涉及任何资源的分发与存储。  

---

### **License**
This project is provided under a **Apache License 2.0** license that can be found in the [LICENSE](LICENSE) file. By using, distributing, or contributing to this project, you agree to the terms and conditions of this license.
