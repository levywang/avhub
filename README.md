<div align="center">
  <img src="web/public/imgs/logo_opaque.png" alt="AvHub Logo">
</div>

# AvHub - R18 Resource Search & Management Tool

**AvHub** is a web platform dedicated to the retrieval and management of R18 video resources, with a Vue 3 frontend served directly by the FastAPI backend.

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

### Core Features

● 🔗 **Magnet Link Search by Video Code**
  &emsp;Accurately find magnet links and cover images corresponding to video codes.
● 📅 **Timely Hacg Resource Updates**
  &emsp;Automatically update and archive monthly hacg resources, with manual refresh support.
● 📊 **Random Video Recommendation**
  &emsp;Random playback functionality based on crawled data.
● 🌐 **Multi-language Support**
  &emsp;Supports Chinese and English interfaces.
● 🎨 **Multiple Theme Options**
  &emsp;Dark, Light, Emerald, Ocean, and Amethyst themes.
● 🔒 **API Key Authentication**
  &emsp;Optional access protection via API Key, configurable via environment variable.

---

## Getting Started

### Run Locally

```bash
git clone https://github.com/levywang/avhub.git
cd avhub

# Build frontend
cd web
npm install
npm run build
cd ..

# Install backend dependencies and run
pip install -r requirements.txt
python main.py
```

The service will be available at `http://127.0.0.1:8000/`. The frontend is served directly by the FastAPI backend from `web/dist`.

### Docker Deployment

The Docker image uses a multi-stage build: Node.js builds the frontend, then the output is copied into the Python image. No pre-build step is needed.

```bash
# Pull and run from Docker Hub
docker run -d \
  -p 8000:8000 \
  -v $PWD/data:/app/data \
  --name avhub \
  levywang/avhub:latest
```

Or build locally:

```bash
git clone https://github.com/levywang/avhub.git
cd avhub
docker build -t avhub .
docker run -d -p 8000:8000 -v $PWD/data:/app/data --name avhub avhub
```

---

### Configuration

The backend configuration file is located at `data/config.yaml`. All key options support **environment variable overrides**.

#### Proxy (required for servers in China)

`missav` is blocked in China. Configure a proxy in `data/config.yaml` or via environment variables:

```yaml
av_spider:
  source_url: "https://missav.ai/cn/search/"
  proxy_url: "http://192.168.50.3:7890"  # HTTP or SOCKS5 proxy
  use_proxy: true
```

#### API Key Authentication

To restrict access, enable authentication:

```yaml
app:
  auth_enabled: true
  api_key: "your-secret-key"
```

Or via environment variables when running Docker:

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

#### All Supported Environment Variables

| Variable | Default | Description |
|---|---|---|
| `AUTH_ENABLED` | `false` | Enable API Key authentication |
| `API_KEY` | `change-me-please` | API Key value |
| `USE_PROXY` | `false` | Enable proxy for spider requests |
| `PROXY_URL` | `http://127.0.0.1:7890` | Proxy address |
| `USE_CACHE` | `true` | Cache search results locally |
| `CACHE_DIR` | `/app/data/.av` | Cache directory path |
| `AV_SOURCE_URL` | `https://missav.ai/cn/search/` | AV search source URL |
| `HACG_SOURCE_URL` | `https://www.hacg.mov` | Hacg source URL |

---

### Technology Stack

- **Frontend**: Vue 3 + Vite + Tailwind CSS + hls.js
- **Backend**: Python + FastAPI (also serves the frontend static files)
- **Containerization**: Docker multi-stage build (Node.js → Python)
- **Privacy**: Does not host any resource files. All data is retrieved via third-party links.

---

### Data Sources

- **Magnet Links & Cover Images**: sourced from **missav**
- **Hacg Resources**: sourced from **hacg liuli**
- **Random Video Recommendations**: sourced from crawled data stored in `/data/video_urls.txt`

All data sources are configured in `data/config.yaml`.

---

### Legal Disclaimer

Users must comply with the laws and regulations of their respective regions. AvHub is solely a resource retrieval tool and does not involve the distribution or storage of any resources.

---

### License

This project is provided under an **Apache License 2.0** license that can be found in the [LICENSE](LICENSE) file. By using, distributing, or contributing to this project, you agree to the terms and conditions of this license.
