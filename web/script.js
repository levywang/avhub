// Tab切换功能

// 添加全局变量
let currentTab = 'search'; // 默认标签页

// 添加视频URL状态管理
let currentVideoUrl = ''; // 存储当前视频URL

// 添加全局变量来跟踪视频播放状态
let wasPlaying = false; // 记录切换标签页前的播放状态

function switchTab(tabName) {
    // 更新当前标签页
    currentTab = tabName;
    
    // 获取所有标签页内容和按钮
    const tabs = document.querySelectorAll('.tab-content');
    const buttons = document.querySelectorAll('.tab-button');
    const videoPlayer = document.getElementById('videoPlayer');
    
    // 隐藏所有标签页内容
    tabs.forEach(tab => {
        tab.classList.add('hidden');
    });
    
    // 移除所有按钮的激活状态
    buttons.forEach(button => {
        button.classList.remove('active');
    });
    
    // 显示选中的标签页内容
    document.getElementById(`${tabName}Tab`).classList.remove('hidden');
    
    // 激活对应的按钮
    document.querySelector(`[data-tab="${tabName}"]`).classList.add('active');
    
    // 处理视频播放状态
    if (tabName === 'player') {
        // 切换到播放器标签页
        if (!currentVideoUrl) {
            loadVideo();
        } else if (wasPlaying && videoPlayer) {
            // 如果之前是播放状态，恢复播放
            videoPlayer.play().catch(e => console.error('Resume play failed:', e));
        }
    } else {
        // 切换到其他标签页
        if (videoPlayer) {
            // 保存当前播放状态
            wasPlaying = !videoPlayer.paused;
            // 暂停视频
            if (!videoPlayer.paused) {
                videoPlayer.pause();
            }
        }
    }
    
    // 当切换到搜索标签页时，获取热门搜索词
    if (tabName === 'search') {
        fetchHotSearches();
    }
}

// 添加 API 配置
const API_CONFIG = {
    BASE_URL: '/app/v1',
    ENDPOINTS: {
        SEARCH: '/avcode',
        COLLECTIONS: '/hacg',
        VIDEO: '/get_video',
        HOT_SEARCHES: '/hot_searches'  // 添加热门搜索接口
    }
};

// 搜索磁力链接

async function searchMagnet() {
    const input = document.getElementById('searchInput');
    const resultsDiv = document.getElementById('searchResults');
    const searchTerm = input.value.replace(/\s+/g, '').trim();
    const notification = document.getElementById('notification');
    const container = document.getElementById('coverImageContainer');
    const regex = /^[A-Za-z][\w\s-]*\d$/;

    if (!searchTerm || !regex.test(searchTerm)) {
        notification.innerHTML = `
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
            </svg>
            <span>${translations[currentLang].emptySearchWarning}</span>
        `;
        notification.style.background = '#dc2626';
        notification.classList.add('show');
        if (container) {
            container.classList.add('hidden');
        }
        setTimeout(() => {
            notification.classList.remove('show');
            notification.style.background = '';
        }, 3000);
        return;
    }

    if (container) {
        container.classList.add('hidden');
        container.style.opacity = '0';
    }
    resultsDiv.innerHTML = '';

    const loadingTemplate = document.getElementById('loadingTemplate');
    resultsDiv.innerHTML = loadingTemplate.innerHTML;
    setLanguage(currentLang);

    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.SEARCH}/${searchTerm}`);
        const data = await response.json();

        if (Array.isArray(data.data) && data.data.length > 0) {
            // 解析并过滤无效结果
            const formattedResults = data.data.map(result => {
                if (Array.isArray(result)) {
                    return result;
                }
                try {
                    return JSON.parse(result.replace(/'/g, '"'));
                } catch (e) {
                    console.error('解析结果出错:', e);
                    return null;
                }
            }).filter(result => result !== null);

            // 对结果进行去重
            const uniqueResults = formattedResults.filter((result, index, self) => {
                // 使用磁力链接作为唯一标识
                const magnet = result[0];
                return index === self.findIndex(r => r[0] === magnet);
            });

            displaySearchResults(uniqueResults);
            setTimeout(() => showCoverImage(searchTerm), 300);
        } else {
            resultsDiv.innerHTML = `<p class="text-center text-inherit opacity-75">${translations[currentLang].noResults}</p>`;
            if (container) {
                container.classList.add('hidden');
            }
        }
    } catch (error) {
        console.error('搜索出错:', error);
        resultsDiv.innerHTML = `<p class="text-center text-inherit opacity-75">${translations[currentLang].searchError}</p>`;
        if (container) {
            container.classList.add('hidden');
        }
    }
}

// 显示搜索结果

function displaySearchResults(results) {
    const searchResults = document.getElementById('searchResults');
    const coverToggle = document.getElementById('coverToggle');
    
    // 如果开关是关闭状态，确保移除已存在的封面图容器
    if (!coverToggle.checked) {
        const existingCoverContainer = document.getElementById('coverImageContainer');
        if (existingCoverContainer) {
            existingCoverContainer.remove();
        }
    }

    // 清空搜索结果
    searchResults.innerHTML = '';

    if (results.length === 0) {
        searchResults.innerHTML = '<div class="text-center py-4">未找到相关结果</div>';
        return;
    }

    const html = results.map(([magnet, title, size, date]) => {
        const tags = extractTags(title);
        const tagsHtml = tags.map(tag => {
            return `<div class="tag" data-type="${tag.type}">${getTagLabel(tag.type)}</div>`;
        }).join('');

        return `
            <div class="magnet-item p-6 rounded-xl">
                <div class="flex flex-col gap-4">
                    <h3 class="font-medium text-inherit break-all"><a rel="nofollow" href="${magnet}" target="_blank" onclick="return false;">${title}</a></h3>
                    <div class="flex flex-wrap gap-2">
                        ${tagsHtml}
                    </div>
                    <p class="text-sm text-inherit opacity-75">
                        ${translations[currentLang].size}: ${size} | ${translations[currentLang].date}: ${date}
                    </p>
                    <button onclick="copyToClipboard('${magnet}')" 
                            class="copy-button w-full px-4 py-2 rounded-lg text-sm font-medium text-white">
                        ${translations[currentLang].copyButton}
                    </button>
                </div>
            </div>
        `;
    }).join('');

    searchResults.innerHTML = html;
    
    // 添加这一行，确保结果按照标签数量排序
    sortResults('tags-desc');
}

// 显示封面图
function showCoverImage(searchTerm) {
    const coverToggle = document.getElementById('coverToggle');
    // 如果开关是关闭状态，直接返回
    if (!coverToggle.checked) {
        return;
    }

    // 获取或创建封面图容器
    let coverImageContainer = document.getElementById('coverImageContainer');
    let image = document.getElementById('coverImage');
    
    // 如果容器不存在，创建容器和图片元素
    if (!coverImageContainer) {
        coverImageContainer = document.createElement('div');
        coverImageContainer.id = 'coverImageContainer';
        coverImageContainer.className = 'cover-image-container hidden card-3d';
        
        // 创建图片元素
        image = document.createElement('img');
        image.id = 'coverImage';
        image.className = 'cover-image';
        image.alt = '封面图片';
        
        // 将图片添加到容器中
        coverImageContainer.appendChild(image);
        
        // 将容器添加到搜索结果之前
        document.getElementById('searchResults').insertAdjacentElement('beforebegin', coverImageContainer);
    } else {
        // 确保容器有3D卡片类
        if (!coverImageContainer.classList.contains('card-3d')) {
            coverImageContainer.classList.add('card-3d');
        }
    }

    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');

    // 如果搜索词为空，隐藏图片
    if (!searchTerm) {
        coverImageContainer.classList.add('hidden');
        return;
    }

    // 正则表达式匹配番号格式
    const avMatch = searchTerm.match(/([a-zA-Z]+)[-]?(\d+)/i);
    if (avMatch) {
        // 提取番号的字母和数字部分
        const prefix = avMatch[1].toLowerCase();
        const number = avMatch[2].padStart(3, '0'); // 确保数字部分至少有3位

        // 构建标准格式的番号 (例如: ipx-096)
        const formattedAV = `${prefix}-${number}`;

        // 构建图片URL
        const imageUrl = `https://fourhoi.com/${formattedAV}/cover-n.jpg`;

        // 设置图片源并显示容器
        image.src = imageUrl;

        coverImageContainer.style.opacity = '0';
        coverImageContainer.classList.remove('hidden');
        
        // 移除之前的 loaded 类
        image.classList.remove('loaded');

        // 处理图片加载完成
        image.onload = () => {
            requestAnimationFrame(() => {
                coverImageContainer.style.transition = 'opacity 0.3s ease';
                coverImageContainer.style.opacity = '1';
                image.classList.add('loaded');
                
                // 添加3D效果初始化
                initCard3DEffect(coverImageContainer);
            });
        };

        // 处理图片加载错误
        image.onerror = () => {
            coverImageContainer.classList.add('hidden');
        };

        // 点击图片显示大图
        coverImageContainer.onclick = (e) => {
            // 获取点击位置相对于容器的坐标
            const rect = coverImageContainer.getBoundingClientRect();
            const x = e.clientX - rect.left;
            const y = e.clientY - rect.top;
            
            // 将容器分为3x3的网格，根据点击位置选择不同的图片
            const width = rect.width;
            const height = rect.height;
            
            // 水平分为左、中、右三部分
            const xSection = Math.floor(x / (width / 3));
            // 垂直分为上、中、下三部分
            const ySection = Math.floor(y / (height / 3));
            
            // 根据9宫格位置选择不同的图片
            const position = ySection * 3 + xSection;
            
            // 预加载图片，确保图片存在再显示
            const preloadImage = new Image();
            
            // 所有位置都使用相同的图片URL
            const newImageUrl = imageUrl;
            
            // 显示加载指示器
            const loadingIndicator = document.createElement('div');
            loadingIndicator.className = 'modal-loading';
            modal.querySelector('.modal-content').appendChild(loadingIndicator);
            
            // 预加载图片
            preloadImage.onload = () => {
                // 图片加载成功，设置src并显示模态框
                modalImage.src = newImageUrl;
                modalImage.classList.add('fullwidth-preview');
                modal.classList.remove('hidden');
                
                // 移除加载指示器
                if (loadingIndicator.parentNode) {
                    loadingIndicator.parentNode.removeChild(loadingIndicator);
                }
                
                setTimeout(() => {
                    modal.classList.add('active');
                }, 10);
            };
            
            preloadImage.onerror = () => {
                console.log(`预览图 ${newImageUrl} 加载失败`);
                
                // 移除加载指示器
                if (loadingIndicator.parentNode) {
                    loadingIndicator.parentNode.removeChild(loadingIndicator);
                }
                
                // 显示错误提示
                modalImage.classList.add('error');
                modal.classList.remove('hidden');
                
                setTimeout(() => {
                    modal.classList.add('active');
                }, 10);
            };
            
            // 开始加载图片
            preloadImage.src = newImageUrl;
            
            // 先显示模态框，但图片为空
            modalImage.src = '';
            modalImage.classList.remove('error');
            modalImage.classList.remove('fullwidth-preview');
            modal.classList.remove('hidden');
            
            // 显示模态框时初始化事件
            initializeModalEvents();
        };
    } else {
        // 如果不是番号格式，隐藏图片容器
        coverImageContainer.classList.add('hidden');
    }
}

// 初始化3D卡片效果
function initCard3DEffect(card) {
    if (!card) return;
    
    // 移除之前可能添加的事件监听器
    card.removeEventListener('mousemove', handleMouseMove);
    card.removeEventListener('mouseleave', handleMouseLeave);
    card.removeEventListener('mouseenter', handleMouseEnter);
    
    // 添加事件监听器
    card.addEventListener('mousemove', handleMouseMove);
    card.addEventListener('mouseleave', handleMouseLeave);
    card.addEventListener('mouseenter', handleMouseEnter);
}

// 处理鼠标移动事件
function handleMouseMove(e) {
    const card = this;
    const rect = card.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    // 计算鼠标位置相对于卡片中心的偏移
    const centerX = rect.width / 2;
    const centerY = rect.height / 2;
    const deltaX = (x - centerX) / centerX;
    const deltaY = (y - centerY) / centerY;
    
    // 减小旋转角度，从15度减小到8度
    const rotateX = deltaY * -8; 
    const rotateY = deltaX * 8;  
    
    // 应用3D变换，减小缩放比例
    card.style.transform = `perspective(1500px) rotateX(${rotateX}deg) rotateY(${rotateY}deg) scale3d(1.02, 1.02, 1.02)`;
    
    // 减小光影效果的强度
    card.style.boxShadow = `
        0 5px 15px rgba(0,0,0,0.2),
        ${deltaX * 5}px ${deltaY * 5}px 15px rgba(0,0,0,0.1)
    `;
    
    // 减小图片内部的视差效果
    const image = card.querySelector('img');
    if (image) {
        image.style.transform = `translateX(${deltaX * -5}px) translateY(${deltaY * -5}px)`;
        
        // 添加亮度调整，使图片在不同角度下亮度均匀
        const brightness = 1 + (deltaX * 0.05);
        image.style.filter = `brightness(${brightness})`;
    }
}

// 处理鼠标离开事件
function handleMouseLeave() {
    const card = this;
    
    // 重置变换
    card.style.transform = 'perspective(1500px) rotateX(0) rotateY(0) scale3d(1, 1, 1)';
    card.style.boxShadow = '0 4px 10px rgba(0, 0, 0, 0.2)';
    
    // 重置图片位置和滤镜
    const image = card.querySelector('img');
    if (image) {
        image.style.transform = 'translateX(0) translateY(0)';
        image.style.filter = 'brightness(1)';
    }
}

// 处理鼠标进入事件
function handleMouseEnter() {
    const card = this;
    
    // 添加初始变换效果，减小缩放比例
    card.style.transition = 'transform 0.3s ease, box-shadow 0.3s ease';
    card.style.transform = 'perspective(1500px) scale3d(1.01, 1.01, 1.01)';
    card.style.boxShadow = '0 5px 15px rgba(0,0,0,0.2)';
    
    // 短暂延迟后移除过渡效果，使鼠标移动时的变换更加流畅
    setTimeout(() => {
        card.style.transition = 'none';
    }, 300); // 增加延迟时间，使过渡更平滑
}

// 视频播放功能
let hls = null;
let autoplayEnabled = localStorage.getItem('autoplay') === 'true'; // 从localStorage读取初始值
let autoNextEnabled = localStorage.getItem('autoNext') === 'true'; // 从localStorage读取初始值

// 初始化自动播放设置
function initializeAutoplaySettings() {
    const autoplayToggle = document.getElementById('autoplayToggle');
    const autoNextToggle = document.getElementById('autoNextToggle');
    
    // 从localStorage读取设置
    autoplayToggle.checked = autoplayEnabled;
    autoNextToggle.checked = autoNextEnabled;

    // 监听自动播放开关变化
    autoplayToggle.addEventListener('change', function() {
        autoplayEnabled = this.checked;
        localStorage.setItem('autoplay', this.checked);
    });

    // 监听自动下一个开关变化
    autoNextToggle.addEventListener('change', function() {
        autoNextEnabled = this.checked;
        localStorage.setItem('autoNext', this.checked);
    });
}

// 初始化封面图开关设置
function initializeCoverToggle() {
    const coverToggle = document.getElementById('coverToggle');
    
    // 从localStorage读取设置
    const showCover = localStorage.getItem('showCover') !== 'false';
    coverToggle.checked = showCover;

    // 监听开关变化
    coverToggle.addEventListener('change', function() {
        localStorage.setItem('showCover', this.checked);
        
        // 如果在搜索页面，重新触发搜索以更新显示
        if (currentTab === 'search') {
            const searchInput = document.getElementById('searchInput');
            if (searchInput.value.trim()) {
                searchMagnet(); // 重新触发搜索
            } else {
                // 如果没有搜索内容，只需要处理封面图容器
                const existingCoverContainer = document.getElementById('coverImageContainer');
                if (existingCoverContainer) {
                    existingCoverContainer.remove();
                }
            }
        }
        // 如果在视频播放页面，重新加载视频以更新封面图
        else if (currentTab === 'player') {
            loadVideo();
        }
    });
}

// 修改 loadVideo 函数
function loadVideo() {
    const videoPlayer = document.getElementById('videoPlayer');
    const videoSourceUrl = document.getElementById('videoSourceUrl');
    const notification = document.getElementById('notification');
    const showCover = document.getElementById('coverToggle').checked;
    
    // 如果已经有视频URL，则不重新请求
    if (currentVideoUrl) {
        if (videoSourceUrl) {
            videoSourceUrl.textContent = currentVideoUrl;
        }
        if (videoPlayer && videoPlayer.src !== currentVideoUrl) {
            videoPlayer.src = currentVideoUrl;
            // 根据自动播放设置决定是否播放
            if (autoplayEnabled) {
                videoPlayer.play().catch(e => console.error('Auto-play failed:', e));
            }
        }
        return;
    }

    // 显示加载中通知
    notification.innerHTML = `
        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
        </svg>
        <span>${translations[currentLang].loadingVideo}</span>
    `;
    notification.classList.add('show');

    // 如果没有视频URL，则请求新的
    fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.VIDEO}`)
        .then(response => response.json())
        .then(data => {
            if (data && data.url) {
                currentVideoUrl = data.url; // 保存视频URL
                if (videoSourceUrl) {
                    videoSourceUrl.textContent = data.url;
                }
                if (videoPlayer) {
                    // 设置视频封面（如果开启了封面图显示）
                    if (showCover && data.img_url) {
                        videoPlayer.poster = data.img_url;
                    } else {
                        videoPlayer.poster = ''; // 清除封面图
                    }

                    videoPlayer.src = data.url;
                    
                    // 根据自动播放设置决定是否播放
                    if (autoplayEnabled) {
                        videoPlayer.play().catch(e => console.error('Auto-play failed:', e));
                    }

                    // 添加视频结束事件监听
                    videoPlayer.onended = () => {
                        if (autoNextEnabled) {
                            clearVideoUrl(); // 清除当前URL
                            loadVideo(); // 加载下一个视频
                        }
                    };
                }
                
                // 隐藏加载通知
                notification.classList.remove('show');
            }
        })
        .catch(error => {
            console.error('加载视频失败:', error);
            notification.innerHTML = `
                <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"></path>
                </svg>
                <span>${translations[currentLang].videoError}</span>
            `;
            notification.style.background = '#dc2626';
            setTimeout(() => {
                notification.classList.remove('show');
                notification.style.background = '';
            }, 3000);
        });
}

// 初始化视频播放器
document.addEventListener('DOMContentLoaded', () => {
    initializeAutoplaySettings(); // 这个函数现在已经包含了自动播放和自动下一个的初始化
    initializeCopyButton();
    initializeCoverToggle();
    
    // 修改下一个按钮的事件监听
    const nextVideoButton = document.getElementById('nextVideo');
    if (nextVideoButton) {
        nextVideoButton.addEventListener('click', () => {
            clearVideoUrl(); // 使用clearVideoUrl函数来处理
        });
    }

    // 初始化模态框关闭功能
    const imageModal = document.getElementById('imageModal');
    const closeModal = document.getElementById('closeModal');

    if (imageModal && closeModal) {
        // 点击关闭按钮关闭模态框
        closeModal.addEventListener('click', () => {
            imageModal.classList.remove('active');
            setTimeout(() => {
                imageModal.classList.add('hidden');
            }, 300);
        });
        
        // 点击模态框背景关闭模态框
        imageModal.addEventListener('click', (e) => {
            if (e.target === imageModal) {
                imageModal.classList.remove('active');
                setTimeout(() => {
                    imageModal.classList.add('hidden');
                }, 300);
            }
        });
        
        // ESC键关闭模态框
        document.addEventListener('keydown', (e) => {
            if (e.key === 'Escape' && !imageModal.classList.contains('hidden')) {
                imageModal.classList.remove('active');
                setTimeout(() => {
                    imageModal.classList.add('hidden');
                }, 300);
            }
        });
    }
    
    // 如果当前是搜索标签页，获取热门搜索词
    if (currentTab === 'search') {
        fetchHotSearches();
    }
});

// 初始化复制按钮功能
function initializeCopyButton() {
    const copyButton = document.getElementById('copySourceUrl');
    const notification = document.getElementById('notification');

    if (copyButton) {
        copyButton.addEventListener('click', async () => {
            const sourceUrlElement = document.getElementById('videoSourceUrl');
            const sourceUrl = sourceUrlElement?.textContent;
            if (!sourceUrl) return;

            try {
                await navigator.clipboard.writeText(sourceUrl);
                
                // 显示复制成功提示
                if (notification) {
                    notification.innerHTML = `
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
                        </svg>
                        <span>${translations[currentLang].copied}</span>
                    `;
                    notification.style.background = '#10B981'; // 成功绿色
                    notification.classList.add('show');
                    setTimeout(() => {
                        notification.classList.remove('show');
                        notification.style.background = '';
                    }, 2000);
                }

                // 更新按钮状态
                copyButton.classList.add('copied');
                const textElement = copyButton.querySelector('.tab-text');
                if (textElement) {
                    const originalText = textElement.textContent;
                    textElement.textContent = translations[currentLang].copied;
                    
                    setTimeout(() => {
                        copyButton.classList.remove('copied');
                        textElement.textContent = originalText;
                    }, 2000);
                }
            } catch (err) {
                console.error('复制失败:', err);
                if (notification) {
                    notification.innerHTML = `
                        <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
                        </svg>
                        <span>${translations[currentLang].copyFailed}</span>
                    `;
                    notification.style.background = '#dc2626';
                    notification.classList.add('show');
                    setTimeout(() => {
                        notification.classList.remove('show');
                        notification.style.background = '';
                    }, 3000);
                }
            }
        });
    }
}

// 语言配置
const translations = {
    zh: {
        search: 'AV搜索',
        collections: '里番合集',
        player: '视频播放',
        searchPlaceholder: '请输入AV番号...',
        searchButton: '搜索',
        copyButton: '复制链接',
        noResults: '未找到相关结果',
        searchError: '搜索出错，请稍后重试',
        size: '大小',
        date: '日期',
        emptySearchWarning: '搜索词为空或有误，请重新输入',
        copySuccess: '已复制到剪贴板',
        copyError: '复制失败，请手动复制',
        loading: '正在搜索中',
        pageSize: '每页显示',
        items: '条',
        total: '共',
        currentPage: '当前第',
        page: '页',
        prevPage: '上一页',
        nextPage: '下一页',
        goToPage: '跳转到',
        sortByDate: '按日期排序',
        sortBySize: '按大小排序',
        newest: '最新',
        oldest: '最早',
        largest: '最大',
        smallest: '最小',
        next: '下一个',
        loadingVideo: '正在加载视频...',
        videoError: '视频加载失败，请稍后重试',
        nsfw: '⚠️ 警告：该内容包含成人内容 (NSFW)，请确保您已年满18岁',
        autoplay: '自动播放',
        sourceUrl: '视频源地址',
        copy: '复制',
        copied: '已复制',
        copyFailed: '复制失败'
    },
    en: {
        search: 'AV Search',
        collections: 'Anime Collection',
        player: 'Video Player',
        searchPlaceholder: 'Enter AV number...',
        searchButton: 'Search',
        copyButton: 'Copy Link',
        noResults: 'No results found',
        searchError: 'Search error, please try again later',
        size: 'Size',
        date: 'Date',
        emptySearchWarning: 'The search term is empty or incorrect, please re-enter',
        copySuccess: 'Copied to clipboard',
        copyError: 'Copy failed, please copy manually',
        loading: 'Searching',
        pageSize: 'Show',
        items: 'items',
        total: 'Total',
        currentPage: 'Page',
        page: '',
        prevPage: 'Previous',
        nextPage: 'Next',
        goToPage: 'Go to page',
        sortByDate: 'Sort by date',
        sortBySize: 'Sort by size',
        newest: 'Newest',
        oldest: 'Oldest',
        largest: 'Largest',
        smallest: 'Smallest',
        next: 'Next',
        loadingVideo: 'Loading video...',
        videoError: 'Failed to load video, please try again later',
        nsfw: '⚠️ Warning: This content contains adult material (NSFW), ensure you are 18+',
        autoplay: 'Auto Play',
        sourceUrl: 'Video Source URL',
        copy: 'Copy',
        copied: 'Copied',
        copyFailed: 'Copy Failed'
    }
};

// 语言图标配置
const LANGUAGES = {
    zh: {
        icon: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M4.083 9h1.946c.089-1.546.383-2.97.837-4.118A6.004 6.004 0 004.083 9zM10 2a8 8 0 100 16 8 8 0 000-16zm0 2c-.076 0-.232.032-.465.262-.238.234-.497.623-.737 1.182-.389.907-.673 2.142-.766 3.556h3.936c-.093-1.414-.377-2.649-.766-3.556-.24-.56-.5-.948-.737-1.182C10.232 4.032 10.076 4 10 4zm3.971 5c-.089-1.546-.383-2.97-.837-4.118A6.004 6.004 0 0115.917 9h-1.946z"/>
              </svg>`,
        label: '中文'
    },
    en: {
        icon: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path fill-rule="evenodd" d="M3 5a2 2 0 012-2h10a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V5zm2.133 0h2.732l1.658 4.51L11.2 5h2.667l-2.667 7.43V16H8.867v-3.57L6.133 5z"/>
              </svg>`,
        label: 'English'
    }
};

// 当前语言
let currentLang = 'zh';

// 主题配置
const THEMES = {
    dark: {
        icon: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/>
              </svg>`,
        label: { zh: '夜间', en: 'Dark' }
    },
    light: {
        icon: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"/>
              </svg>`,
        label: { zh: '日间', en: 'Light' }
    },
    emerald: {
        icon: `<svg t="1741614536732" class="icon" viewBox="0 0 1024 1024" version="1.1"
                xmlns="http://www.w3.org/2000/svg" p-id="5381" width="20" height="20">
                <path d="M469.333333 896 469.333333 714.24C449.28 721.493333 427.946667 725.333333 405.333333 725.333333 298.666667 725.333333 213.333333 640 213.333333 533.333333 213.333333 479.146667 234.666667 430.506667 271.36 395.52 261.546667 372.48 256 346.88 256 320 256 213.333333 341.333333 128 448 128 514.56 128 573.44 162.133333 608 213.333333 611.413333 213.333333 614.826667 213.333333 618.666667 213.333333 748.373333 213.333333 853.333333 318.293333 853.333333 448 853.333333 577.706667 748.373333 682.666667 618.666667 682.666667 597.333333 682.666667 576 679.68 554.666667 673.706667L554.666667 896 469.333333 896Z" p-id="5382" fill="#10b981"></path>
              </svg>`,
        label: { zh: '翠绿', en: 'Emerald' }
    },
    ocean: {
        icon: `<svg t="1741614777271" class="icon" viewBox="0 0 1024 1024" version="1.1"
                xmlns="http://www.w3.org/2000/svg" p-id="11657" id="mx_n_1741614777271" width="200" height="200">
                <path d="M704 341.333333a170.666667 170.666667 0 0 1-124.16-52.906666A90.453333 90.453333 0 0 0 512 256a89.173333 89.173333 0 0 0-67.84 31.573333A174.506667 174.506667 0 0 1 320 341.333333a170.666667 170.666667 0 0 1-124.16-53.333333A90.026667 90.026667 0 0 0 128 256a42.666667 42.666667 0 0 1 0-85.333333 174.506667 174.506667 0 0 1 124.16 53.333333 88.32 88.32 0 0 0 135.253333 0 170.666667 170.666667 0 0 1 248.746667 0 88.746667 88.746667 0 0 0 135.68 0A173.653333 173.653333 0 0 1 896 170.666667a42.666667 42.666667 0 0 1 0 85.333333 90.026667 90.026667 0 0 0-67.84 31.573333A174.506667 174.506667 0 0 1 704 341.333333z" fill="#3b82f6" p-id="11658"></path>
                <path d="M704 597.333333a170.666667 170.666667 0 0 1-124.16-52.906666A90.453333 90.453333 0 0 0 512 512a89.173333 89.173333 0 0 0-67.84 31.573333 170.666667 170.666667 0 0 1-248.32 0A90.026667 90.026667 0 0 0 128 512a42.666667 42.666667 0 0 1 0-85.333333 174.506667 174.506667 0 0 1 124.16 52.906666 88.32 88.32 0 0 0 135.253333 0 170.666667 170.666667 0 0 1 248.746667 0 88.746667 88.746667 0 0 0 135.68 0A173.653333 173.653333 0 0 1 896 426.666667a42.666667 42.666667 0 0 1 0 85.333333 90.026667 90.026667 0 0 0-67.84 31.573333A174.506667 174.506667 0 0 1 704 597.333333z" fill="#3b82f6" p-id="11659"></path>
                <path d="M704 853.333333a170.666667 170.666667 0 0 1-124.16-52.906666A90.453333 90.453333 0 0 0 512 768a89.173333 89.173333 0 0 0-67.84 31.573333 170.666667 170.666667 0 0 1-248.32 0A90.026667 90.026667 0 0 0 128 768a42.666667 42.666667 0 0 1 0-85.333333 174.506667 174.506667 0 0 1 124.16 52.906666 88.32 88.32 0 0 0 135.253333 0 170.666667 170.666667 0 0 1 248.746667 0 88.746667 88.746667 0 0 0 135.68 0A173.653333 173.653333 0 0 1 896 682.666667a42.666667 42.666667 0 0 1 0 85.333333 90.026667 90.026667 0 0 0-67.84 31.573333A174.506667 174.506667 0 0 1 704 853.333333z" fill="#3b82f6" p-id="11660"></path>
              </svg>`,
        label: { zh: '海蓝', en: 'Ocean' }
    },
    amethyst: {
        icon: `<svg t="1741614881262" class="icon" viewBox="0 0 1024 1024" version="1.1"
                xmlns="http://www.w3.org/2000/svg" p-id="5206" width="20" height="20">
                <path d="M512.8 216l185.6 200H327.2l185.6-200z m273.6 200h172.8l-224-288h-56l107.2 288z m-273.6 413.6L732 448H292.8l220 381.6zM647.2 128H377.6L276 412.8 512.8 168l236.8 245.6L647.2 128z m121.6 320l-256 450.4-256-450.4H87.2L512 963.2 933.6 448H768.8z m-530.4-32l107.2-288h-56L68 416h170.4z" p-id="5207" fill="#8b5cf6"></path>
              </svg>`,
        label: { zh: '紫晶', en: 'Amethyst' }
    }
};

// 排序配置
const SORT_OPTIONS = {
    'tags-desc': {
        icon: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M18.045 3.007 12.31 3a1.965 1.965 0 0 0-1.4.585l-7.33 7.394a2 2 0 0 0 0 2.805l6.573 6.631a1.957 1.957 0 0 0 1.4.585 1.965 1.965 0 0 0 1.4-.585l7.409-7.477A2 2 0 0 0 21 11.479v-5.5a2.972 2.972 0 0 0-2.955-2.972Zm-2.452 6.438a1 1 0 1 1 0-2 1 1 0 0 1 0 2Z"/>
               </svg>`,
        label: { zh: '标签最多', en: 'Most Tags' }
    },
    'date-desc': {
        icon: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3z"/>
              </svg>`,
        label: { zh: '最新日期', en: 'Newest' }
    },
    'date-asc': {
        icon: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 3a1 1 0 000 2h4a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h11a1 1 0 100-2H3z"/>
              </svg>`,
        label: { zh: '最早日期', en: 'Oldest' }
    },
    'size-desc': {
        icon: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M10 5a1 1 0 011 1v3h3a1 1 0 110 2h-3v3a1 1 0 11-2 0v-3H6a1 1 0 110-2h3V6a1 1 0 011-1z"/>
              </svg>`,
        label: { zh: '文件最大', en: 'Largest' }
    },
    'size-asc': {
        icon: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                <path d="M3 10a1 1 0 011-1h12a1 1 0 110 2H4a1 1 0 01-1-1z"/>
              </svg>`,
        label: { zh: '文件最小', en: 'Smallest' }
    }
};

// 初始化
document.addEventListener('DOMContentLoaded', () => {
    // 设置初始主题
    const savedTheme = localStorage.getItem('theme') || 'dark';
    toggleTheme(savedTheme);

    // 设置初始语言
    const savedLang = localStorage.getItem('language') || 'zh';
    setLanguage(savedLang);

    // 初始化所有按钮
    initializeButtons();

    // 加载合集列表
    loadCollections();
    
    // 添加事件监听器
    
    // 语言切换按钮
    const langButton = document.getElementById('languageToggle');
    if (langButton) {
        langButton.onclick = () => showLanguageMenu(langButton);
    }

    // 主题切换按钮
    const themeButton = document.getElementById('themeToggle');
    if (themeButton) {
        themeButton.onclick = () => showThemeMenu(themeButton);
    }
    
    // 搜索输入框添加回车键触发搜索
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.addEventListener('keypress', function(event) {
            if (event.key === 'Enter') {
                event.preventDefault();
                searchMagnet();
            }
        });
    }
    
    // 回到顶部按钮
    const backToTopButton = document.getElementById('backToTop');
    if (backToTopButton) {
        // 初始隐藏按钮
        backToTopButton.classList.add('hidden');
        
        // 监听滚动事件
        window.addEventListener('scroll', function() {
            if (window.scrollY > 300) {
                backToTopButton.classList.remove('hidden');
            } else {
                backToTopButton.classList.add('hidden');
            }
        });
        
        // 点击事件
        backToTopButton.addEventListener('click', function() {
            window.scrollTo({
                top: 0,
                behavior: 'smooth'
            });
        });
    }
    
    // 初始化大图预览功能
    const modal = document.getElementById('imageModal');
    const closeButton = document.getElementById('closeModal');
    
    // 关闭按钮点击事件
    if (closeButton) {
        closeButton.onclick = () => {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300);
        };
    }
    
    // 点击模态框背景关闭
    if (modal) {
        modal.onclick = (e) => {
            if (e.target === modal) {
                modal.classList.remove('active');
                setTimeout(() => {
                    modal.classList.add('hidden');
                }, 300);
            }
        };
    }
    
    // ESC键关闭模态框
    document.addEventListener('keydown', (e) => {
        if (e.key === 'Escape' && modal && !modal.classList.contains('hidden')) {
            modal.classList.remove('active');
            setTimeout(() => {
                modal.classList.add('hidden');
            }, 300);
        }
    });
    
    // 下一个视频按钮
    const nextVideoButton = document.getElementById('nextVideo');
    if (nextVideoButton) {
        nextVideoButton.addEventListener('click', () => {
            clearVideoUrl(); // 使用clearVideoUrl函数来处理
        });
    }
    
    // 如果当前是搜索标签页，获取热门搜索词
    if (currentTab === 'search') {
        fetchHotSearches();
    }
});

// 切换主题功能
function toggleTheme(themeName) {
    // 移除所有主题类
    document.body.removeAttribute('data-theme');
    // 设置新主题
    document.body.setAttribute('data-theme', themeName);
    // 保存主题设置
    localStorage.setItem('theme', themeName);

    // 更新主题按钮图标
    const themeButton = document.getElementById('themeToggle');
    if (themeButton) {
        themeButton.innerHTML = THEMES[themeName].icon;
    }

    // 重新初始化所有按钮事件
    initializeButtons();
}

// 初始化所有按钮事件
function initializeButtons() {
    // 初始化标签页按钮
    document.querySelectorAll('.tab-button').forEach(button => {
        const tabName = button.dataset.tab;
        button.onclick = () => switchTab(tabName);
    });

    // 初始化主题切换按钮
    const themeButton = document.getElementById('themeToggle');
    if (themeButton) {
        themeButton.onclick = () => showThemeMenu(themeButton);
    }

    // 初始化语言切换按钮
    const langButton = document.getElementById('languageToggle');
    if (langButton) {
        langButton.onclick = () => showLanguageMenu(langButton);
    }

    // 初始化排序按钮
    const sortButton = document.getElementById('sortButton');
    if (sortButton) {
        sortButton.onclick = () => showSortMenu(sortButton);
    }
}

// 显示语言菜单
function showLanguageMenu(button) {
    const existingMenu = document.querySelector('.language-menu');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }

    const menu = document.createElement('div');
    menu.className = 'theme-menu language-menu';
    
    // 对号图标 SVG
    const checkmarkSvg = `<svg class="w-5 h-5 mr-2" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">
        <polyline points="20 6 9 17 4 12"></polyline>
    </svg>`;
    
    menu.innerHTML = `
        <button class="theme-menu-item" data-lang="zh" data-active="${currentLang === 'zh'}">
            ${currentLang === 'zh' ? checkmarkSvg : '<span class="w-5 h-5 mr-2"></span>'}
            <span>中文</span>
        </button>
        <button class="theme-menu-item" data-lang="en" data-active="${currentLang === 'en'}">
            ${currentLang === 'en' ? checkmarkSvg : '<span class="w-5 h-5 mr-2"></span>'}
            <span>English</span>
        </button>
    `;

    // 将菜单添加到 body
    document.body.appendChild(menu);

    // 计算菜单位置
    const buttonRect = button.getBoundingClientRect();
    const menuRect = menu.getBoundingClientRect();
    
    // 确保菜单不会超出视口
    let top = buttonRect.bottom;
    let left = Math.min(
        buttonRect.left,
        window.innerWidth - menuRect.width - 10
    );

    // 如果菜单会超出底部，则显示在按钮上方
    if (top + menuRect.height > window.innerHeight) {
        top = buttonRect.top - menuRect.height;
    }
    
    menu.style.position = 'fixed';
    menu.style.top = `${top}px`;
    menu.style.left = `${left}px`;
    menu.style.zIndex = '1000';

    // 窗口滚动时更新菜单位置
    const updateMenuPosition = () => {
        const updatedRect = button.getBoundingClientRect();
        let newTop = updatedRect.bottom;
        
        // 如果菜单会超出底部，则显示在按钮上方
        if (newTop + menuRect.height > window.innerHeight) {
            newTop = updatedRect.top - menuRect.height;
        }
        
        menu.style.top = `${newTop}px`;
        menu.style.left = `${Math.min(updatedRect.left, window.innerWidth - menuRect.width - 10)}px`;
    };

    window.addEventListener('scroll', updateMenuPosition);
    window.addEventListener('resize', updateMenuPosition);

    menu.addEventListener('click', (e) => {
        const langItem = e.target.closest('.theme-menu-item');
        if (langItem) {
            const newLang = langItem.dataset.lang;
            setLanguage(newLang);
            menu.remove();
            window.removeEventListener('scroll', updateMenuPosition);
            window.removeEventListener('resize', updateMenuPosition);
        }
    });

    // 点击其他区域关闭菜单
    const closeMenu = (e) => {
        if (!button.contains(e.target) && !menu.contains(e.target)) {
            menu.remove();
            document.removeEventListener('click', closeMenu);
            window.removeEventListener('scroll', updateMenuPosition);
            window.removeEventListener('resize', updateMenuPosition);
        }
    };

    // 使用 re·uestAnimationFrame 延迟添加点击事件，避免立即触发
    requestAnimationFrame(() => {
        document.addEventListener('click', closeMenu);
    });

    // ESC 键关闭菜单
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            menu.remove();
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('click', closeMenu);
            window.removeEventListener('scroll', updateMenuPosition);
            window.removeEventListener('resize', updateMenuPosition);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

// 语言切换功能
function setLanguage(lang) {
    currentLang = lang;
    localStorage.setItem('language', lang);

    // 不再需要更新语言按钮文本，因为我们使用固定的"文"字符作为图标
    // const languageButton = document.getElementById('languageToggle');
    // if (languageButton) {
    //     languageButton.querySelector('.language-text').textContent = 
    //         lang === 'zh' ? '中文' : 'English';
    // }

    // 更新所有带有 data-zh 和 data-en 属性的元素
    document.querySelectorAll('[data-zh][data-en]').forEach(element => {
        element.textContent = lang === 'zh' ? element.getAttribute('data-zh') : element.getAttribute('data-en');
    });

    // 更新搜索框占位符
    const searchInput = document.getElementById('searchInput');
    if (searchInput) {
        searchInput.placeholder = lang === 'zh' ? 
            searchInput.getAttribute('data-zh-placeholder') : 
            searchInput.getAttribute('data-en-placeholder');
    }

    // 更新排序按钮文本
    const sortButton = document.getElementById('sortButton');
    if (sortButton && sortButton.value) {
        const sortOption = SORT_OPTIONS[sortButton.value];
        if (sortOption) {
            sortButton.innerHTML = `
                ${sortOption.icon}
                <span class="ml-2">${sortOption.label[lang]}</span>
            `;
        }
    }

    // 更新主题菜单文本
    const themeMenuItems = document.querySelectorAll('.theme-menu-item');
    themeMenuItems.forEach(item => {
        const themeName = item.dataset.theme;
        if (themeName && THEMES[themeName]) {
            const label = item.querySelector('.theme-label');
            if (label) {
                label.textContent = THEMES[themeName].label[lang];
            }
        }
    });

    // 更新分页控件文本
    updatePaginationText();

    // 更新所有按钮文本
    document.querySelectorAll('button').forEach(button => {
        // 更新搜索按钮
        if (button.classList.contains('search-button')) {
            const searchText = button.querySelector('.tab-text');
            if (searchText) {
                searchText.textContent = translations[lang].searchButton;
            }
        }
        
        // 更新复制按钮
        if (button.classList.contains('copy-button')) {
            button.textContent = translations[lang].copyButton;
        }
    });

    // 重新渲染搜索结果
    const searchResults = document.getElementById('searchResults');
    if (searchResults && searchResults.children.length > 0) {
        const firstChild = searchResults.firstElementChild;
        if (!firstChild.classList.contains('loading-container') && 
            firstChild.tagName.toLowerCase() !== 'p') {
            try {
                const results = Array.from(searchResults.children).map(item => {
                    const title = item.querySelector('h3').textContent;
                    const info = item.querySelector('p').textContent;
                    const [size, date] = info.split('|').map(str => str.split(':')[1].trim());
                    const magnet = item.querySelector('button').getAttribute('onclick').split("'")[1];
                    return [magnet, title, size, date];
                });
                displaySearchResults(results);
            } catch (error) {
                console.error('解析搜索结果失败:', error);
            }
        }
    }

    // 重新加载合集
    const collectionsTab = document.getElementById('collectionsTab');
    if (collectionsTab && !collectionsTab.classList.contains('hidden')) {
        loadCollections();
    }

    // 更新加载动画文本
    const loadingText = document.querySelector('.loading-text');
    if (loadingText) {
        loadingText.textContent = translations[lang].loading;
    }

    // 更新所有错误和提示消息
    document.querySelectorAll('.notification, .error-message, .info-message').forEach(el => {
        const messageKey = el.dataset.messageKey;
        if (messageKey && translations[lang][messageKey]) {
            el.textContent = translations[lang][messageKey];
        }
    });

    // 更新模态框关闭提示文本
    const modal = document.getElementById('imageModal');
    if (modal) {
        modal.setAttribute('data-close-text', 
            lang === 'en' ? 'Click anywhere to close' : '点击任意位置关闭'
        );
    }
}

// 更新分页控件文本
function updatePaginationText() {
    const paginationElements = document.querySelectorAll('.pagination-container');
    paginationElements.forEach(container => {
        const prevBtn = container.querySelector('.prev-page');
        const nextBtn = container.querySelector('.next-page');
        const pageInfo = container.querySelector('.page-info');
        const pageSizeSelect = container.querySelector('.page-size-select');
        
        if (prevBtn) prevBtn.textContent = translations[currentLang].prevPage;
        if (nextBtn) nextBtn.textContent = translations[currentLang].nextPage;
        
        if (pageInfo) {
            const currentPage = pageInfo.dataset.currentPage;
            const totalPages = pageInfo.dataset.totalPages;
            const pageSize = pageInfo.dataset.pageSize;
            
            pageInfo.textContent = `${translations[currentLang].currentPage}${currentPage}${translations[currentLang].page} / ${translations[currentLang].total}${totalPages}${translations[currentLang].page}`;
        }
        
        if (pageSizeSelect) {
            const label = pageSizeSelect.previousElementSibling;
            if (label) {
                label.textContent = `${translations[currentLang].pageSize}: `;
            }
            const suffix = pageSizeSelect.nextElementSibling;
            if (suffix) {
                suffix.textContent = ` ${translations[currentLang].items}`;
            }
        }
    });
}

// 解析文件大小
function parseFileSize(sizeStr) {
    try {
        // 确保输入是字符串
        sizeStr = String(sizeStr).trim();
        
        // 匹配数字和单位
        const match = sizeStr.match(/^([\d.]+)\s*([KMGT]?B)$/i);
        if (!match) return 0;
        
        const [, value, unit] = match;
        const size = parseFloat(value);
        
        // 转换到字节
        switch (unit.toUpperCase()) {
            case 'KB':
                return size * 1024;
            case 'MB':
                return size * 1024 * 1024;
            case 'GB':
                return size * 1024 * 1024 * 1024;
            case 'TB':
                return size * 1024 * 1024 * 1024 * 1024;
            case 'B':
            default:
                return size;
        }
    } catch (error) {
        console.error('解析文件大小错误:', error);
        return 0;
    }
}

// 排序功能
function sortResults(sortType) {
    const resultsDiv = document.getElementById('searchResults');
    const results = Array.from(resultsDiv.children);
    
    if (results.length === 0 || results[0].classList.contains('loading-container')) {
        return;
    }

    results.sort((a, b) => {
        try {
            const aInfo = a.querySelector('p').textContent;
            const bInfo = b.querySelector('p').textContent;
            
            // 提取大小和日期
            const [aSize, aDate] = aInfo.split('|').map(str => str.split(':')[1].trim());
            const [bSize, bDate] = bInfo.split('|').map(str => str.split(':')[1].trim());
            
            // 获取标签数量
            const aTagCount = a.querySelectorAll('.tag').length;
            const bTagCount = b.querySelectorAll('.tag').length;
            
            switch (sortType) {
                case 'tags-desc':
                    return bTagCount - aTagCount;
                case 'date-desc':
                    return new Date(bDate || 0) - new Date(aDate || 0);
                case 'date-asc':
                    return new Date(aDate || 0) - new Date(bDate || 0);
                case 'size-desc':
                    return parseFileSize(bSize) - parseFileSize(aSize);
                case 'size-asc':
                    return parseFileSize(aSize) - parseFileSize(bSize);
                default:
                    return bTagCount - aTagCount; // 默认按标签数量排序
            }
        } catch (error) {
            console.error('排序比较错误:', error);
            return 0;
        }
    });

    // 清空并重新添加排序后的结果
    resultsDiv.innerHTML = '';
    results.forEach(result => resultsDiv.appendChild(result));
}

// 显示动漫合集
function displayCollections(collections) {
    const collectionList = document.getElementById('collectionList');
    
    // 清空现有内容
    collectionList.innerHTML = '';
    
    // 检查collections是否为数组
    if (Array.isArray(collections)) {
        // 处理数组类型的数据
        collections.forEach(collection => {
            const collectionItem = document.createElement('div');
            collectionItem.className = 'magnet-item p-6 rounded-xl';
            collectionItem.innerHTML = `
                <div class="flex flex-col gap-4">
                    <h3 class="font-medium text-inherit break-all"><a rel="nofollow" href="${collection.link}" target="_blank" onclick="return false;">${collection.title}</a></h3>
                    <button onclick="copyToClipboard('${collection.link}')" 
                            class="copy-button w-full px-4 py-2 rounded-lg text-sm font-medium text-white">
                        ${translations[currentLang].copyButton}
                    </button>
                </div>
            `;
            collectionList.appendChild(collectionItem);
        });
    } else if (typeof collections === 'object' && collections !== null) {
        // 处理对象类型的数据
        Object.entries(collections).forEach(([title, link]) => {
            const collectionItem = document.createElement('div');
            collectionItem.className = 'magnet-item p-6 rounded-xl';
            collectionItem.innerHTML = `
                <div class="flex flex-col gap-4">
                    <h3 class="font-medium text-inherit break-all"><a rel="nofollow" href="${link}" target="_blank" onclick="return false;">${title}</a></h3>
                    <button onclick="copyToClipboard('${link}')" 
                            class="copy-button w-full px-4 py-2 rounded-lg text-sm font-medium text-white">
                        ${translations[currentLang].copyButton}
                    </button>
                </div>
            `;
            collectionList.appendChild(collectionItem);
        });
    } else {
        // 没有数据或数据格式不正确
        collectionList.innerHTML = `<p class="text-center text-inherit opacity-75">${translations[currentLang].noResults}</p>`;
    }
}

// 获取标签文字
function getTagLabel(type) {
    const tagLabels = {
        hd: { zh: '高清', en: 'HD' },
        subtitle: { zh: '字幕', en: 'SUB' },
        uncensored: { zh: '无码', en: 'Uncensored' },
        chinese: { zh: '中文', en: 'Chinese' },
        leak: { zh: '破解', en: 'Leaked' }
    };
    return tagLabels[type][currentLang];
}

// 提取标签
function extractTags(title) {
    const tags = [];
    const tagMap = {
        // 高清标签
        'HD': {type: 'hd', priority: 1},
        'FHD': {type: 'hd', priority: 1},
        '高清': {type: 'hd', priority: 1},
        
        // 字幕标签
        '字幕': {type: 'subtitle', priority: 2},
        '-C': {type: 'subtitle', priority: 2},
        'sub': {type: 'subtitle', priority: 2},
        'SUB': {type: 'subtitle', priority: 2},
        
        // 无码标签
        '無修正': {type: 'uncensored', priority: 3},
        '无码': {type: 'uncensored', priority: 3},
        'uncensored': {type: 'uncensored', priority: 3},
        
        // 中文标签
        '中文': {type: 'chinese', priority: 4},
        'ch': {type: 'chinese', priority: 4},
        'CH': {type: 'chinese', priority: 4},
        'chinese': {type: 'chinese', priority: 4},
        
        // 破解标签
        '破解': {type: 'leak', priority: 5},
        'leak': {type: 'leak', priority: 5},
        'LEAK': {type: 'leak', priority: 5}
    };

    // 将标题转换为小写以进行不区分大小写的匹配
    const lowerTitle = title.toLowerCase();
    
    // 使用 Set 来存储已添加的标签类型，避免重复
    const addedTypes = new Set();

    // 遍历所有关键词进行匹配
    Object.entries(tagMap).forEach(([keyword, {type, priority}]) => {
        // 如果这个类型的标签还没有添加过，并且标题中包含关键词
        if (!addedTypes.has(type) && lowerTitle.includes(keyword.toLowerCase())) {
            tags.push({type, priority});
            addedTypes.add(type);
        }
    });

    // 按优先级排序
    return tags.sort((a, b) => a.priority - b.priority);
}

// 获取标签样式
function getTagStyle(tag) {
    // 更新标签样式为玻璃态设计
    const styleMap = {
        '高清': 'bg-blue-500/20 text-blue-300',
        '字幕': 'bg-green-500/20 text-green-300',
        '无码': 'bg-red-500/20 text-red-300',
        '有码': 'bg-yellow-500/20 text-yellow-300',
        '中文': 'bg-purple-500/20 text-purple-300',
        '无修正': 'bg-pink-500/20 text-pink-300',
        '破解版': 'bg-indigo-500/20 text-indigo-300'
    };

    return styleMap[tag] || 'bg-gray-500/20 text-gray-300';
}

// 加载动漫合集
async function loadCollections() {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.COLLECTIONS}`);
        const data = await response.json();
        displayCollections(data.data);
    } catch (error) {
        console.error('加载合集失败:', error);
    }
}

// 复制到剪贴板
function copyToClipboard(text) {
    const notification = document.getElementById('notification');
    
    // 显示通知的辅助函数
    const showNotification = (success) => {
        notification.innerHTML = success ? `
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M5 13l4 4L19 7"></path>
            </svg>
            <span>${translations[currentLang].copySuccess}</span>
        ` : `
            <svg fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M6 18L18 6M6 6l12 12"></path>
            </svg>
            <span>${translations[currentLang].copyError}</span>
        `;
        
        notification.style.background = success ? '#1bb76e' : '#dc2626';
        notification.classList.add('show');
        
        setTimeout(() => {
            notification.classList.remove('show');
            notification.style.background = '';
        }, 3000);
    };

    // 尝试使用 Clipboard API
    if (navigator.clipboard && window.isSecureContext) {
        navigator.clipboard.writeText(text)
            .then(() => showNotification(true))
            .catch(() => {
                // 如果 Clipboard API 失败，回退到 execCommand 方法
                fallbackCopyToClipboard(text);
            });
    } else {
        // 在非安全上下文中直接使用 execCommand 方法
        fallbackCopyToClipboard(text);
    }

    // execCommand 复制方法
    function fallbackCopyToClipboard(text) {
        try {
            // 创建临时文本区域
            const textArea = document.createElement('textarea');
            textArea.value = text;
            
            // 设置样式使其不可见
            textArea.style.position = 'fixed';
            textArea.style.top = '0';
            textArea.style.left = '0';
            textArea.style.width = '2em';
            textArea.style.height = '2em';
            textArea.style.padding = '0';
            textArea.style.border = 'none';
            textArea.style.outline = 'none';
            textArea.style.boxShadow = 'none';
            textArea.style.background = 'transparent';
            textArea.style.opacity = '0';
            
            document.body.appendChild(textArea);
            textArea.focus();
            textArea.select();

            // 尝试执行复制命令
            const successful = document.execCommand('copy');
            document.body.removeChild(textArea);
            
            showNotification(successful);
        } catch (err) {
            console.error('复制失败:', err);
            showNotification(false);
        }
    }
}

// 修改排序下拉菜单
function showSortMenu(button) {
    const existingMenu = document.querySelector('.sort-menu');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }

    const currentSort = button.value || 'tags-desc'; // 默认使用标签排序
    const sortMenu = document.createElement('div');
    sortMenu.className = 'sort-menu';

    button.parentElement.style.position = 'relative';
    
    sortMenu.innerHTML = Object.entries(SORT_OPTIONS).map(([value, option]) => `
        <button class="theme-menu-item" data-sort="${value}" data-active="${value === currentSort}">
            ${option.icon}
            <span>${option.label[currentLang]}</span>
        </button>
    `).join('');

    button.parentElement.appendChild(sortMenu);

    sortMenu.addEventListener('click', (e) => {
        const sortItem = e.target.closest('.theme-menu-item');
        if (sortItem) {
            const newSort = sortItem.dataset.sort;
            button.value = newSort;
            sortResults(newSort);
            button.innerHTML = `
                ${SORT_OPTIONS[newSort].icon}
                <span class="ml-2">${SORT_OPTIONS[newSort].label[currentLang]}</span>
            `;
            sortMenu.remove();
        }
    });

    document.addEventListener('click', (e) => {
        if (!button.contains(e.target) && !sortMenu.contains(e.target)) {
            sortMenu.remove();
        }
    }, { once: true });
}

// 显示主题菜单
function showThemeMenu(button) {
    const existingMenu = document.querySelector('.theme-menu');
    if (existingMenu) {
        existingMenu.remove();
        return;
    }

    const currentTheme = localStorage.getItem('theme') || 'dark';
    const themeMenu = document.createElement('div');
    themeMenu.className = 'theme-menu';

    themeMenu.innerHTML = Object.entries(THEMES).map(([name, theme]) => `
        <button class="theme-menu-item" data-theme="${name}" data-active="${name === currentTheme}">
            ${theme.icon}
            <span class="theme-label">${theme.label[currentLang]}</span>
        </button>
    `).join('');

    // 将菜单添加到 body 而不是按钮中
    document.body.appendChild(themeMenu);

    // 计算菜单位置
    const buttonRect = button.getBoundingClientRect();
    const menuRect = themeMenu.getBoundingClientRect();
    
    // 确保菜单不会超出视口
    let top = buttonRect.bottom;
    let left = Math.min(
        buttonRect.left,
        window.innerWidth - menuRect.width - 10
    );

    // 如果菜单会超出底部，则显示在按钮上方
    if (top + menuRect.height > window.innerHeight) {
        top = buttonRect.top - menuRect.height;
    }

    themeMenu.style.position = 'fixed';
    themeMenu.style.top = `${top}px`;
    themeMenu.style.left = `${left}px`;
    themeMenu.style.zIndex = '1000';

    // 窗口滚动时更新菜单位置
    const updateMenuPosition = () => {
        const updatedRect = button.getBoundingClientRect();
        let newTop = updatedRect.bottom;
        
        // 如果菜单会超出底部，则显示在按钮上方
        if (newTop + menuRect.height > window.innerHeight) {
            newTop = updatedRect.top - menuRect.height;
        }
        
        themeMenu.style.top = `${newTop}px`;
        themeMenu.style.left = `${Math.min(updatedRect.left, window.innerWidth - menuRect.width - 10)}px`;
    };

    window.addEventListener('scroll', updateMenuPosition);
    window.addEventListener('resize', updateMenuPosition);

    // 点击菜单项时切换主题并关闭菜单
    themeMenu.addEventListener('click', (e) => {
        const themeItem = e.target.closest('.theme-menu-item');
        if (themeItem) {
            const newTheme = themeItem.dataset.theme;
            toggleTheme(newTheme);
            themeMenu.remove();
            window.removeEventListener('scroll', updateMenuPosition);
            window.removeEventListener('resize', updateMenuPosition);
        }
    });

    // 点击其他区域关闭菜单
    const closeMenu = (e) => {
        if (!button.contains(e.target) && !themeMenu.contains(e.target)) {
            themeMenu.remove();
            document.removeEventListener('click', closeMenu);
            window.removeEventListener('scroll', updateMenuPosition);
            window.removeEventListener('resize', updateMenuPosition);
        }
    };

    // 使用 requestAnimationFrame 延迟添加点击事件，避免立即触发
    requestAnimationFrame(() => {
        document.addEventListener('click', closeMenu);
    });

    // ESC 键关闭菜单
    const handleEscape = (e) => {
        if (e.key === 'Escape') {
            themeMenu.remove();
            document.removeEventListener('keydown', handleEscape);
            document.removeEventListener('click', closeMenu);
            window.removeEventListener('scroll', updateMenuPosition);
            window.removeEventListener('resize', updateMenuPosition);
        }
    };
    document.addEventListener('keydown', handleEscape);
}

// 修改 Service Worker 注册代码
if ('serviceWorker' in navigator && window.location.protocol === 'https:') {
    window.addEventListener('load', () => {
        navigator.serviceWorker.register('./sw.js') // 使用相对路径
            .then(registration => {
                console.log('ServiceWorker registration successful');
            })
            .catch(err => {
                console.error('ServiceWorker registration failed: ', err);
            });
    });
} else {
    console.log('ServiceWorker is not supported or requires HTTPS');
}

// 修改模态框点击事件处理
function initializeModalEvents() {
    const modal = document.getElementById('imageModal');
    const modalImage = document.getElementById('modalImage');

    // 设置关闭提示文本
    modal.setAttribute('data-close-text', 
        currentLang === 'en' ? 'Click anywhere to close' : '点击任意位置关闭'
    );

    // 点击模态框任意位置关闭
    modal.addEventListener('click', (e) => {
        // 添加关闭动画
        modal.classList.remove('active');
        modalImage.style.transform = 'scale(0.9)';
        modalImage.style.opacity = '0';
        
        // 延迟隐藏模态框，等待动画完成
        setTimeout(() => {
            modal.classList.add('hidden');
            // 重置图片样式
            modalImage.style.transform = '';
            modalImage.style.opacity = '';
        }, 300);
    });
}

// 添加清除视频URL的函数（可以在需要重新加载视频时调用）
function clearVideoUrl() {
    if (currentVideoUrl) { // 只有在有当前URL时才清除并重新加载
        currentVideoUrl = '';
        loadVideo();
    }
}

// 添加获取热门搜索的函数
async function fetchHotSearches() {
    try {
        const response = await fetch(`${API_CONFIG.BASE_URL}${API_CONFIG.ENDPOINTS.HOT_SEARCHES}`);
        const data = await response.json();
        
        if (data.status === 'succeed' && Array.isArray(data.data)) {
            const hotSearchesContainer = document.getElementById('hotSearches');
            hotSearchesContainer.innerHTML = data.data
                .map(term => `
                    <button class="hot-search-tag" onclick="searchWithTerm('${term}')">
                        ${term}
                    </button>
                `).join('');
        }
    } catch (error) {
        console.error('获取热门搜索失败:', error);
    }
}

// 添加点击热门搜索词的处理函数
function searchWithTerm(term) {
    const searchInput = document.getElementById('searchInput');
    searchInput.value = term;
    searchMagnet();
}
