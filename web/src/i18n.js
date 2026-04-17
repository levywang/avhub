export const translations = {
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
    loading: '正在搜索中...',
    hotSearches: '热门搜索：',
    linksUpdating: '链接持续更新中...',
    refreshCollections: '立即更新',
    refreshing: '更新中...',
    refreshSuccess: '更新成功',
    refreshError: '更新失败，请稍后重试',
    showCover: '显示封面',
    autoplay: '自动播放',
    autoNext: '自动下一个',
    next: '下一个',
    loadingVideo: '正在加载视频...',
    videoError: '视频加载失败，请稍后重试',
    nsfw: '⚠️ 警告：该内容包含成人内容 (NSFW)，请确保您已年满18岁',
    sourceUrl: '视频源地址',
    copy: '复制',
    copied: '已复制',
    copyFailed: '复制失败',
    browserNotSupported: '当前浏览器不支持该视频格式',
    copyright: '版权所有'
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
    loading: 'Searching...',
    hotSearches: 'Hot Searches:',
    linksUpdating: 'Links are being updated...',
    refreshCollections: 'Refresh Now',
    refreshing: 'Refreshing...',
    refreshSuccess: 'Refresh successful',
    refreshError: 'Refresh failed, please try again later',
    showCover: 'Show Cover',
    autoplay: 'Auto Play',
    autoNext: 'Auto Next',
    next: 'Next',
    loadingVideo: 'Loading video...',
    videoError: 'Failed to load video, please try again later',
    nsfw: '⚠️ Warning: This content contains adult material (NSFW), ensure you are 18+',
    sourceUrl: 'Video Source URL',
    copy: 'Copy',
    copied: 'Copied',
    copyFailed: 'Copy Failed',
    browserNotSupported: 'Current browser does not support this video format',
    copyright: 'Copyright'
  }
}

export const SORT_OPTIONS = {
  'tags-desc': {
    label: { zh: '标签最多', en: 'Most Tags' },
    icon: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 24 24"><path d="M21.41 11.58l-9-9A2 2 0 0011 2H4a2 2 0 00-2 2v7a2 2 0 00.59 1.42l9 9A2 2 0 0013 22a2 2 0 001.41-.59l7-7A2 2 0 0022 13a2 2 0 00-.59-1.42zM5.5 7A1.5 1.5 0 117 5.5 1.5 1.5 0 015.5 7z"/></svg>`
  },
  'date-desc': {
    label: { zh: '最新日期', en: 'Newest' },
    icon: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M3 3a1 1 0 000 2h11a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h4a1 1 0 100-2H3z"/></svg>`
  },
  'date-asc': {
    label: { zh: '最早日期', en: 'Oldest' },
    icon: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path d="M3 3a1 1 0 000 2h4a1 1 0 100-2H3zM3 7a1 1 0 000 2h7a1 1 0 100-2H3zM3 11a1 1 0 100 2h11a1 1 0 100-2H3z"/></svg>`
  },
  'size-desc': {
    label: { zh: '文件最大', en: 'Largest' },
    icon: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M5.293 7.707a1 1 0 010-1.414l4-4a1 1 0 011.414 0l4 4a1 1 0 01-1.414 1.414L11 5.414V17a1 1 0 11-2 0V5.414L6.707 7.707a1 1 0 01-1.414 0z" clip-rule="evenodd"/></svg>`
  },
  'size-asc': {
    label: { zh: '文件最小', en: 'Smallest' },
    icon: `<svg class="w-4 h-4" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M14.707 12.293a1 1 0 010 1.414l-4 4a1 1 0 01-1.414 0l-4-4a1 1 0 111.414-1.414L9 14.586V3a1 1 0 012 0v11.586l2.293-2.293a1 1 0 011.414 0z" clip-rule="evenodd"/></svg>`
  }
}

export const THEMES = {
  dark: {
    label: { zh: '夜间', en: 'Dark' },
    icon: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path d="M17.293 13.293A8 8 0 016.707 2.707a8.001 8.001 0 1010.586 10.586z"/></svg>`
  },
  light: {
    label: { zh: '日间', en: 'Light' },
    icon: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z" clip-rule="evenodd"/></svg>`
  },
  emerald: {
    label: { zh: '翠绿', en: 'Emerald' },
    icon: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17 8C8 10 5.9 16.17 3.82 21.34L5.71 22l1-2.3A4.49 4.49 0 008 20c8 0 10-8 10-8s-2 4-6 4c4-4 5-8 5-8z"/></svg>`
  },
  ocean: {
    label: { zh: '海蓝', en: 'Ocean' },
    icon: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M17.5 8.5c-1.5 0-2.5 1-4 1s-2.5-1-4-1-2.5 1-4 1v2c1.5 0 2.5-1 4-1s2.5 1 4 1 2.5-1 4-1 2.5 1 4 1v-2c-1.5 0-2.5-1-4-1zm0 5c-1.5 0-2.5 1-4 1s-2.5-1-4-1-2.5 1-4 1v2c1.5 0 2.5-1 4-1s2.5 1 4 1 2.5-1 4-1 2.5 1 4 1v-2c-1.5 0-2.5-1-4-1zm0-10c-1.5 0-2.5 1-4 1s-2.5-1-4-1-2.5 1-4 1v2c1.5 0 2.5-1 4-1s2.5 1 4 1 2.5-1 4-1 2.5 1 4 1V4c-1.5 0-2.5-1-4-1z"/></svg>`
  },
  amethyst: {
    label: { zh: '紫晶', en: 'Amethyst' },
    icon: `<svg class="w-5 h-5" fill="currentColor" viewBox="0 0 24 24"><path d="M6 2l-4 7h5l3 13 3-13h5L14 2H6zm4 14.5L8.5 11H6.18L8 5h8l1.82 6H15.5L10 16.5z"/></svg>`
  }
}
