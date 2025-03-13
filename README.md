<div align="center">
      <img src="web\imgs\logo_opaque.png" alt="FTP Web Client Logo">
</div>

# AvHub - R18 Resource Search & Management Tool 

**AvHub** is a web platform dedicated to the retrieval and management of adult video resources.  

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

### **Core Features**  
● 🔗 **Magnet Link Search by Video Code**  
  &emsp;Accurately find magnet links and cover images corresponding to video codes.  
● 📅 **Timely Hacg Resource Updates**  
  &emsp;Automatically update and archive monthly hacg resources.  
● 📊 **Random Video Recommendation**  
  &emsp;Random playback functionality based on crawled data.  
● 🌐 **Multi-language Support**  
  &emsp;Supports multiple language interfaces to meet global user needs.  
● 🎨 **Multiple Theme Options**  
  &emsp;Offers various theme color schemes to enhance user experience.  

---

## Getting Started  

### Run Locally  
```bash  
git clone https://github.com/levywang/avhub.git  
cd avhub  
pip install -r requirements.txt  
python main.py  
```  
The default API address: `https://api.wwlww.org/`  

You can configure a reverse proxy and domain, replacing `BASE_URL` in line 52 of `web/script.js`.  

The backend configuration file is located in `data/config.yaml`. Modify it according to your actual needs.  

### Docker Deployment  
**Note: Python Version >= 3.7**  
```bash  
git clone https://github.com/levywang/avhub.git  
cd avhub  
docker run -d -p <your_server_port>:80 -v $PWD:/app --name avhub levywang/avhub:latest  
```  
---

### **Configuration Instructions**  

If you deploy the project on a server within China, the source site `missav` is blocked, so you need to configure a proxy server in `config.yaml`. Edit the `/data/config.yaml` file and modify it as follows:  
```yaml
av_spider:
  source_url: "https://missav.ai/cn/search/"
  proxy_url: "http://192.168.50.3:7890" # HTTP or SOCKS5 proxy
  use_proxy: true
```

---

### **Technology Stack**  
- **Frontend**:  
  - Built with **Tailwind CSS** for a modern, responsive interface.  
  - Integrated with **hls.js** for smooth video playback.  
- **Backend**:  
  - Developed using **FastAPI**, a Python framework, to provide efficient and stable API services.  
- **Privacy Protection**:  
  - Strictly adheres to privacy principles and does not directly host any resource files. All data is retrieved through third-party links.  

---

### **Data Sources**  
- **Magnet Links and Cover Images**: Sourced from **missav**.  
- **Hacg Resources**: Sourced from **hacg liuli**.  
- **Random Video Recommendations**: Sourced from crawled data stored in the local file `/data/video_urls.txt`.  

The above data sources are configured in `/data/config.yaml`. If the data sources change or become inaccessible, modifications and maintenance are required.  

---

### **Legal Disclaimer**  
Users must comply with the laws and regulations of their respective regions. AvHub is solely a resource retrieval tool and does not involve the distribution or storage of any resources.  

---

### **License**  
This project is provided under an **Apache License 2.0** license that can be found in the [LICENSE](LICENSE) file. By using, distributing, or contributing to this project, you agree to the terms and conditions of this license.
