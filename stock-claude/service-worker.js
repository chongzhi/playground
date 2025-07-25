/**
 * Service Worker for Stock Trading Records App
 * 提供离线缓存和PWA功能
 */

const CACHE_NAME = 'stock-app-v1.0.0';
const urlsToCache = [
    '/',
    '/index.html',
    '/css/base.css',
    '/css/layout.css',
    '/css/components.css',
    '/css/mobile.css',
    '/js/modules/storage.js',
    '/js/modules/calculator.js',
    '/js/modules/transaction.js',
    '/js/modules/portfolio.js',
    '/js/app.js',
    '/manifest.json',
    '/icons/icon-192x192.png',
    '/icons/icon-512x512.png'
];

// 安装事件 - 缓存资源
self.addEventListener('install', (event) => {
    event.waitUntil(
        caches.open(CACHE_NAME)
            .then((cache) => {
                console.log('Opened cache');
                return cache.addAll(urlsToCache);
            })
    );
});

// 激活事件 - 清理旧缓存
self.addEventListener('activate', (event) => {
    event.waitUntil(
        caches.keys().then((cacheNames) => {
            return Promise.all(
                cacheNames.map((cacheName) => {
                    if (cacheName !== CACHE_NAME) {
                        console.log('Deleting old cache:', cacheName);
                        return caches.delete(cacheName);
                    }
                })
            );
        })
    );
});

// 获取事件 - 提供离线支持
self.addEventListener('fetch', (event) => {
    event.respondWith(
        caches.match(event.request)
            .then((response) => {
                // 如果缓存中有，直接返回缓存
                if (response) {
                    return response;
                }
                
                // 否则从网络获取
                return fetch(event.request).then((response) => {
                    // 检查是否有效响应
                    if (!response || response.status !== 200 || response.type !== 'basic') {
                        return response;
                    }
                    
                    // 克隆响应
                    const responseToCache = response.clone();
                    
                    caches.open(CACHE_NAME)
                        .then((cache) => {
                            cache.put(event.request, responseToCache);
                        });
                    
                    return response;
                });
            })
            .catch(() => {
                // 离线时的回退处理
                console.log('Offline mode activated');
                return caches.match('/index.html');
            })
    );
});

// 后台同步 - 处理离线提交的数据
self.addEventListener('sync', (event) => {
    if (event.tag === 'sync-transactions') {
        event.waitUntil(syncTransactions());
    }
});

// 推送通知
self.addEventListener('push', (event) => {
    if (event.data) {
        const data = event.data.json();
        const options = {
            body: data.body,
            icon: '/icons/icon-192x192.png',
            badge: '/icons/icon-72x72.png',
            vibrate: [200, 100, 200],
            tag: 'stock-notification',
            data: data
        };
        
        event.waitUntil(
            self.registration.showNotification(data.title, options)
        );
    }
});

// 通知点击事件
self.addEventListener('notificationclick', (event) => {
    event.notification.close();
    
    event.waitUntil(
        clients.openWindow('/')
    );
});

// 消息处理
self.addEventListener('message', (event) => {
    if (event.data && event.data.type === 'SKIP_WAITING') {
        self.skipWaiting();
    }
});

// 同步交易数据（模拟）
async function syncTransactions() {
    try {
        // 这里可以添加实际的同步逻辑
        console.log('Syncing transactions...');
        return Promise.resolve();
    } catch (error) {
        console.error('Sync failed:', error);
        throw error;
    }
}

// 缓存管理工具
const cacheManager = {
    async clearCache() {
        const keys = await caches.keys();
        return Promise.all(keys.map(key => caches.delete(key)));
    },
    
    async updateCache() {
        const cache = await caches.open(CACHE_NAME);
        await cache.addAll(urlsToCache);
    },
    
    async getCacheSize() {
        const cache = await caches.open(CACHE_NAME);
        const keys = await cache.keys();
        let totalSize = 0;
        
        for (const request of keys) {
            const response = await cache.match(request);
            if (response) {
                const blob = await response.blob();
                totalSize += blob.size;
            }
        }
        
        return totalSize;
    }
};