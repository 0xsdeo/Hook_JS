// ==UserScript==
// @name         Get_Vue
// @namespace    https://github.com/0xsdeo/Hook_JS
// @version      2025-10-05
// @description  try to take over the world!
// @author       0xsdeo
// @run-at       document-start
// @match        *
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

// Vue实例和Router获取函数（DOM监控版 - 适用于油猴脚本）
(function() {
    // 更强的全局执行锁
    const LOCK_KEY = '__VUE_GETTER_RUNNING__';
    if (window[LOCK_KEY]) {
        console.warn('⚠️ Vue获取脚本已在运行中，跳过本次执行');
        return;
    }

    // 使用不可配置的属性作为锁
    try {
        Object.defineProperty(window, LOCK_KEY, {
            value: true,
            writable: false,
            configurable: false
        });
    } catch (e) {
        // 如果无法设置，说明已经在运行
        console.warn('⚠️ 无法设置执行锁，脚本可能已在运行');
        return;
    }

    let observer = null;
    let allTimeoutIds = []; // 收集所有定时器ID
    const validInstancesCache = []; // 缓存所有找到的有效实例
    let hasOutputResult = false; // 标记是否已经输出过结果

    // 获取Vue版本
    function getVueVersion(vueRoot) {
        let version = vueRoot.__vue_app__?.version ||
            vueRoot.__vue__?.$root?.$options?._base?.version;

        if (!version || version === 'unknown') {
            // 尝试从全局Vue对象获取
            if (window.Vue && window.Vue.version) {
                version = window.Vue.version;
            }
            // 尝试从Vue DevTools获取
            else if (window.__VUE_DEVTOOLS_GLOBAL_HOOK__ &&
                window.__VUE_DEVTOOLS_GLOBAL_HOOK__.Vue) {
                version = window.__VUE_DEVTOOLS_GLOBAL_HOOK__.Vue.version;
            }
        }

        return version || 'unknown';
    }

    // 路径拼接函数
    function joinPath(base, path) {
        if (!path) return base || '/';
        if (path.startsWith('/')) return path;
        if (!base || base === '/') return '/' + path;
        return (base.endsWith('/') ? base.slice(0, -1) : base) + '/' + path;
    }

    // 列出所有路由
    function listAllRoutes(router) {
        const list = [];
        try {
            // Vue Router 4
            if (typeof router.getRoutes === 'function') {
                router.getRoutes().forEach(r => {
                    list.push({
                        name: r.name,
                        path: r.path,
                        meta: r.meta
                    });
                });
                return list;
            }

            // Vue Router 2/3
            if (router.options?.routes) {
                function traverse(routes, basePath = '') {
                    routes.forEach(r => {
                        const fullPath = joinPath(basePath, r.path);
                        list.push({ name: r.name, path: fullPath, meta: r.meta });
                        if (Array.isArray(r.children) && r.children.length) {
                            traverse(r.children, fullPath);
                        }
                    });
                }
                traverse(router.options.routes);
                return list;
            }

            // 从matcher获取
            if (router.matcher?.getRoutes) {
                const routes = router.matcher.getRoutes();
                routes.forEach(r => {
                    list.push({ name: r.name, path: r.path, meta: r.meta });
                });
                return list;
            }

            // 从历史记录获取
            if (router.history?.current?.matched) {
                router.history.current.matched.forEach(r => {
                    list.push({ name: r.name, path: r.path, meta: r.meta });
                });
                return list;
            }

            console.warn('🚫 无法列出路由信息');
        } catch (e) {
            console.warn('获取路由列表时出错:', e);
        }

        return list;
    }

    // 获取所有Vue根实例的核心函数（带深度限制的BFS扫描）
    function getAllVueRootInstances() {
        // 如果 body 不存在，返回空数组，等待下次轮询重试
        if (!document.body) {
            return [];
        }

        const instances = [];
        const maxDepth = 1000; // 最大搜索深度
        const queue = [{ node: document.body, depth: 0 }];
        const visited = new Set(); // 防止重复访问

        while (queue.length > 0) {
            const { node, depth } = queue.shift();

            // 节点为空，跳过
            if (!node) {
                continue;
            }

            // 超过最大深度，跳过
            if (depth > maxDepth) {
                continue;
            }

            // 已访问过，跳过
            if (visited.has(node)) {
                continue;
            }
            visited.add(node);

            // 只处理元素节点
            if (node.nodeType !== 1) {
                continue;
            }

            // 检查 Vue 3
            if (node.__vue_app__) {
                instances.push({ element: node, app: node.__vue_app__, version: 3 });
            }
            // 检查 Vue 2
            else if (node.__vue__) {
                instances.push({ element: node, app: node.__vue__, version: 2 });
            }

            // 将子节点加入队列
            if (node.childNodes && node.childNodes.length > 0) {
                for (let i = 0; i < node.childNodes.length; i++) {
                    queue.push({ node: node.childNodes[i], depth: depth + 1 });
                }
            }
        }

        return instances;
    }

    // 定位 Vue Router 实例
    function findVueRouter(vueRoot) {
        try {
            if (vueRoot.__vue_app__) {
                // Vue3 + Router4
                const app = vueRoot.__vue_app__;

                if (app.config?.globalProperties?.$router) {
                    return app.config.globalProperties.$router;
                }

                const instance = app._instance;
                if (instance?.appContext?.config?.globalProperties?.$router) {
                    return instance.appContext.config.globalProperties.$router;
                }

                if (instance?.ctx?.$router) {
                    return instance.ctx.$router;
                }
            }

            if (vueRoot.__vue__) {
                // Vue2 + Router2/3
                const vue = vueRoot.__vue__;
                return vue.$router ||
                    vue.$root?.$router ||
                    vue.$root?.$options?.router ||
                    vue._router;
            }
        } catch (e) {
            console.warn('获取Router实例时出错:', e);
        }
        return null;
    }

    // 尝试获取实例并返回有Router的结果
    function tryGetInstances() {
        const instances = getAllVueRootInstances();

        if (instances.length === 0) {
            return null;
        }

        const validInstances = [];

        // 遍历所有实例，找出有Router的
        for (const { element, app, version } of instances) {
            const routerInstance = findVueRouter(element);

            if (routerInstance) {
                // 检查是否已经在缓存中（通过routerInstance引用判断，避免重复）
                const alreadyCached = validInstancesCache.some(cached => cached.routerInstance === routerInstance);

                if (!alreadyCached) {
                    // 获取所有路由
                    const allRoutes = listAllRoutes(routerInstance);

                    // 获取具体版本号
                    const vueVersion = getVueVersion(element);

                    const instanceInfo = {
                        element: element,
                        vueInstance: app,
                        routerInstance: routerInstance,
                        version: version,
                        vueVersion: vueVersion,
                        routes: allRoutes
                    };

                    validInstances.push(instanceInfo);
                    validInstancesCache.push(instanceInfo); // 加入缓存

                    // 立即输出新发现的Router
                    const instanceIndex = validInstancesCache.length;
                    console.log(`\n📋 Vue Router 路由列表 [实例 ${instanceIndex} - Vue ${vueVersion}]：`);
                    console.table(allRoutes.map(route => ({
                        Name: route.name || '(unnamed)',
                        Path: route.path
                    })));
                    console.log(`\n🔗 Vue Router 实例 [${instanceIndex}]：`);
                    console.log(routerInstance);
                }
            }
        }

        return validInstances.length > 0 ? validInstances : null;
    }

    // DOM变化监控函数
    function startDOMObserver() {
        // 立即尝试一次完整遍历
        tryGetInstances();

        // 创建 MutationObserver 持续监控 DOM 变化
        observer = new MutationObserver((mutations) => {
            if (hasOutputResult) {
                return; // 检测已结束，跳过后续监控
            }

            // 检查是否有新增的元素节点
            let hasNewNodes = false;
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    hasNewNodes = true;
                    break;
                }
            }

            if (hasNewNodes) {
                // 有新节点添加，尝试获取实例（会自动输出新发现的Router）
                tryGetInstances();
            }
        });

        // 开始观察整个 document
        observer.observe(document.documentElement, {
            childList: true,
            subtree: true,
            attributes: false,
            characterData: false
        });
    }

    // 清理资源
    function cleanupResources() {
        if (hasOutputResult) {
            return; // 已经清理过，跳过
        }

        hasOutputResult = true;

        // 清理所有定时器并停止监控
        allTimeoutIds.forEach(id => clearTimeout(id));
        allTimeoutIds = [];
        if (observer) {
            observer.disconnect();
            observer = null;
        }

        // 输出检测结束信息
        if (validInstancesCache.length === 0) {
            console.log('❌ 未找到任何含Router的Vue实例');
        }
    }

    // 后备轮询重试机制
    function startPollingRetry() {
        let delay = 100;
        let detectRemainingTries = 5;

        function executeDetection() {
            // 尝试获取（会自动输出新发现的Router）
            tryGetInstances();

            if (detectRemainingTries > 0) {
                detectRemainingTries--;
                const timeoutId = setTimeout(() => {
                    executeDetection();
                }, delay);
                allTimeoutIds.push(timeoutId);
                delay *= 2;
            } else {
                // 达到最大重试次数，清理资源
                cleanupResources();
            }
        }

        // 延迟100ms后开始轮询
        const initialTimeoutId = setTimeout(() => {
            executeDetection();
        }, 100);
        allTimeoutIds.push(initialTimeoutId);
    }

    // 主执行逻辑
    function init() {
        // 如果 DOM 还在加载
        if (document.readyState === 'loading') {
            document.addEventListener('DOMContentLoaded', () => {
                startDOMObserver();
                startPollingRetry();
            });
        } else {
            // DOM 已经加载完成，立即开始
            startDOMObserver();
            startPollingRetry();
        }
    }

    // 启动
    init();
})();