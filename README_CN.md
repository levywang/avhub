<div align="center">
  <img src="web/public/imgs/logo_opaque.png" alt="AvHub Logo">
</div>

# AvHub - R18 资源搜索和管理工具

**AvHub** 是一个致力于检索和管理 R18 视频资源的 Web 平台，前端基于 Vue 3 构建，由 FastAPI 后端直接托管。

Cloudflare Page: https://avhub.pages.dev/

Vercel Page: https://avhub.vercel.app/

****

[![GitHub license](https://img.shields.io/github/license/levywang/avhub?label=License&logo=github)](https://github.com/levywang/avhub/blob/main/LICENSE "Click to view the repo on Github")
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

### 核心特性

● 🔗 **番号磁力链搜索**  
  &emsp;精准查找番号对应的磁力链接和封面图  
● 📅 **里番资源定时更新**  
  &emsp;自动更新并归档月度里番资源，支持手动立即刷新  
● 📊 **随机视频推荐**  
  &emsp;基于爬虫数据的随机播放功能  
● 🌐 **多语言支持**  
  &emsp;支持中文和英文界面  
● 🎨 **多种主题配色**  
  &emsp;提供夜间、日间、翠绿、海蓝、紫晶五种主题  
● 🔒 **API Key 访问认证**  
  &emsp;可选的接口访问保护，支持环境变量配置  

---

## 快速开始

### 本地运行

```bash
git clone https://github.com/levywang/avhub.git
cd avhub

# 构建前端
cd web
npm install
npm run build
cd ..

# 安装后端依赖并运行
pip install -r requirements.txt
python main.py
```

服务启动后访问 `http://127.0.0.1:8000/`，前端静态文件由 FastAPI 后端直接托管，无需单独部署。

### Docker 部署

Docker 镜像采用多阶段构建：Node.js 阶段构建前端，Python 阶段运行后端，无需本地预先构建前端。

```bash
# 从 Docker Hub 拉取并运行
docker run -d \
  -p 8000:8000 \
  -v $PWD/data:/app/data \
  --name avhub \
  levywang/avhub:latest
```

或本地构建：

```bash
git clone https://github.com/levywang/avhub.git
cd avhub
docker build -t avhub .
docker run -d -p 8000:8000 -v $PWD/data:/app/data --name avhub avhub
```

---

### 配置说明

后端配置文件位于 `data/config.yaml`，所有关键配置项均支持**环境变量覆盖**。

#### 代理配置（中国大陆服务器必须）

由于源站 `missav` 在中国大陆被屏蔽，需要配置代理：

```yaml
av_spider:
  source_url: "https://missav.ai/cn/search/"
  proxy_url: "http://192.168.50.3:7890"  # HTTP 或 SOCKS5 代理
  use_proxy: true
```

#### API Key 认证

开启后所有 `/api/` 接口需要携带 `X-API-Key` 请求头才能访问，前端会自动弹出输入框引导用户填写：

```yaml
app:
  auth_enabled: true
  api_key: "your-secret-key"
```

#### Docker 环境变量方式配置

```bash
docker run -d \
  -p 8000:8000 \
  -v $PWD/data:/app/data \
  -e AUTH_ENABLED=true \
  -e API_KEY=your-secret-key \
  -e USE_PROXY=true \
  -e PROXY_URL=http://192.168.50.3:7890 \
  --name avhub \
  levywang/avhub:latest
```

#### 所有支持的环境变量

| 变量名 | 默认值 | 说明 |
|---|---|---|
| `AUTH_ENABLED` | `false` | 是否启用 API Key 认证 |
| `API_KEY` | `123456` | API Key 值 |
| `USE_PROXY` | `false` | 是否启用代理 |
| `PROXY_URL` | `http://127.0.0.1:7890` | 代理地址 |
| `USE_CACHE` | `true` | 是否缓存搜索结果 |
| `CACHE_DIR` | `/app/data/.av` | 缓存目录路径 |
| `AV_SOURCE_URL` | `https://missav.ai/cn/search/` | AV 搜索源地址 |
| `HACG_SOURCE_URL` | `https://www.hacg.mov` | 里番资源源地址 |

---

### 技术栈

- **前端**：Vue 3 + Vite + Tailwind CSS + hls.js
- **后端**：Python + FastAPI（同时托管前端静态文件）
- **容器化**：Docker 多阶段构建（Node.js → Python）
- **隐私保护**：不直接托管任何资源文件，所有数据均通过第三方链接获取

---

### 数据源

- **番号磁力链和封面图**：来源于 **missav**
- **里番资源**：来源于 **hacg 琉璃神社**
- **随机视频推荐**：来源于爬虫数据，存储在本地文件 `/data/video_urls.txt`

以上数据源均配置在 `data/config.yaml` 中，如数据源变更或无法访问，需自行修改维护。

---

### 法律声明

用户需自行遵守所在地区相关法律法规。AvHub 仅为资源检索工具，不涉及任何资源的分发与存储。

---

### License

This project is provided under a **Apache License 2.0** license that can be found in the [LICENSE](LICENSE) file. By using, distributing, or contributing to this project, you agree to the terms and conditions of this license.
