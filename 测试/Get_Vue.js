// ==UserScript==
// @name         Get_Vue
// @namespace    https://github.com/0xsdeo/Hook_JS
// @version      2025-10-05
// @description  get vue-router
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
    let hasLoggedInitialScan = false; // 是否已输出初始扫描信息

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

    // 获取所有Vue根实例的核心函数（每次都完整扫描）
    function getAllVueRootInstances() {
        const instances = [];
        const all = document.querySelectorAll('*');

        for (let i = 0; i < all.length; i++) {
            const el = all[i];
            // Vue 3
            if (el.__vue_app__) {
                instances.push({ element: el, app: el.__vue_app__, version: 3 });
            }
            // Vue 2
            else if (el.__vue__) {
                instances.push({ element: el, app: el.__vue__, version: 2 });
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

    // 消息解包函数（兼容不同版本的 devtools）
    const VUE_DEVTOOLS_MESSAGE_KEY = '__VUE_DEVTOOLS_VUE_DETECTED_EVENT__';
    const LEGACY_VUE_DEVTOOLS_MESSAGE_KEY = '_vue-devtools-send-message';

    function unpackVueDevtoolsMessage(data) {
        if (data.key === VUE_DEVTOOLS_MESSAGE_KEY) {
            return data.data;
        } else if (data.key === LEGACY_VUE_DEVTOOLS_MESSAGE_KEY) {
            return data.message;
        }
        return data;
    }

    // 激活Vue 2 devtools
    function crackVue2(Vue) {
        if (!Vue) {
            return false;
        }
        const devtools = window.__VUE_DEVTOOLS_GLOBAL_HOOK__;
        if (devtools) {
            Vue.config.devtools = true;
            devtools.enabled = true; // 确保 devtools 启用
            devtools.emit('init', Vue);
            console.log('✅ Vue 2 Devtools 已激活');
        }
        return true;
    }

    // 激活Vue 3 devtools
    function crackVue3(app) {
        if (!app) {
            return false;
        }
        const devtools = window.__VUE_DEVTOOLS_GLOBAL_HOOK__;
        if (devtools) {
            devtools.enabled = true;
            const version = app.version;
            devtools.emit('app:init', app, version, {
                Fragment: Symbol.for('v-fgt'),
                Text: Symbol.for('v-txt'),
                Comment: Symbol.for('v-cmt'),
                Static: Symbol.for('v-stc'),
            });
            console.log('✅ Vue 3 Devtools 已激活');
        }
        return true;
    }

    // 监听 devtools 消息并响应（关键：实现 replay 机制）
    function listenVueDevtoolsMessage() {
        const messageHandler = (e) => {
            try {
                if (!window.__VUE_DEVTOOLS_GLOBAL_HOOK__) return;

                const data = unpackVueDevtoolsMessage(e.data);

                // 检测到 Vue 但 devtools 未启用的情况
                if (e.source === window && data.vueDetected && !data.devtoolsEnabled) {
                    // 标记为已启用，避免无限循环
                    data.devtoolsEnabled = true;

                    // 执行激活
                    let crackSuccess = false;
                    if (window.__VUE__) {
                        // Vue 3
                        const instances = getAllVueRootInstances();
                        const vue3Instance = instances.find(inst => inst.version === 3);
                        if (vue3Instance) {
                            crackSuccess = crackVue3(vue3Instance.app);
                        }
                    } else {
                        // Vue 2
                        const instances = getAllVueRootInstances();
                        const vue2Instance = instances.find(inst => inst.version === 2);
                        if (vue2Instance) {
                            const Vue = Object.getPrototypeOf(vue2Instance.app).constructor;
                            let RootVue = Vue;
                            while (RootVue.super) {
                                RootVue = RootVue.super;
                            }
                            crackSuccess = crackVue2(RootVue);
                        }
                    }

                    // 关键：重新发送消息给 devtools（replay）
                    if (crackSuccess) {
                        window.postMessage(e.data, '*');
                        // 激活成功后可以移除监听器
                        window.removeEventListener('message', messageHandler);
                    }
                }
            } catch (err) {
                console.error('❌ Devtools 消息处理失败:', err);
            }
        };

        window.addEventListener('message', messageHandler);
    }

    // 尝试获取实例并返回有Router的结果
    function tryGetInstances() {
        const instances = getAllVueRootInstances();

        if (instances.length === 0) {
            return null;
        }

        const validInstances = [];
        const newRouterInstances = []; // 记录新发现的 Router 实例

        // 遍历所有实例，找出有Router的
        for (const { element, app, version } of instances) {
            const routerInstance = findVueRouter(element);

            if (routerInstance) {
                // 检查是否已经在缓存中（通过routerInstance引用判断，避免重复）
                const alreadyCached = validInstancesCache.some(cached => cached.routerInstance === routerInstance);

                if (!alreadyCached) {
                    // 激活devtools
                    if (version === 3) {
                        crackVue3(app);
                    } else if (version === 2) {
                        const Vue = Object.getPrototypeOf(app).constructor;
                        let RootVue = Vue;
                        while (RootVue.super) {
                            RootVue = RootVue.super;
                        }
                        crackVue2(RootVue);
                    }

                    // 获取所有路由
                    const allRoutes = listAllRoutes(routerInstance);
                    const instanceInfo = {
                        element: element,
                        vueInstance: app,
                        routerInstance: routerInstance,
                        version: version,
                        routes: allRoutes
                    };

                    validInstances.push(instanceInfo);
                    validInstancesCache.push(instanceInfo); // 加入缓存
                    newRouterInstances.push(instanceInfo); // 记录新实例
                }
            }
        }

        // 只在发现新的 Router 实例时输出
        if (newRouterInstances.length > 0) {
            console.log(`🔎 扫描到 ${instances.length} 个Vue实例`);

            newRouterInstances.forEach(info => {
                // 安全获取 className（处理 SVGAnimatedString 等特殊情况）
                let className = '';
                if (info.element.className) {
                    if (typeof info.element.className === 'string') {
                        className = info.element.className.split(' ')[0];
                    } else if (info.element.className.baseVal) {
                        // SVG 元素的 className 是 SVGAnimatedString 对象
                        className = info.element.className.baseVal.split(' ')[0];
                    }
                }
                const elDesc = `${info.element.tagName}${info.element.id ? '#' + info.element.id : ''}${className ? '.' + className : ''}`;
                console.log(`  └─ Vue${info.version} 实例: ${elDesc} ✅ 含Router`);
                console.log(`  📋 该实例共有 ${info.routes.length} 个路由`);
                console.log(info.routes);
            });

            // 输出当前所有Router实例的路由表格
            console.log(`\n📋 当前共 ${validInstancesCache.length} 个Router实例的所有路由：`);
            console.table(validInstancesCache.flatMap((inst, idx) =>
                inst.routes.map(route => ({
                    Instance: idx + 1,
                    Name: route.name || '(unnamed)',
                    Path: route.path
                }))
            ));
        }

        return validInstances.length > 0 ? validInstances : null;
    }

    // DOM变化监控函数
    function startDOMObserver() {
        // 立即尝试一次完整遍历
        const result = tryGetInstances();
        if (!hasLoggedInitialScan) {
            hasLoggedInitialScan = true;
            if (result) {
                console.log(`🎉 初始扫描完成，找到 ${result.length} 个含Router的Vue实例`);
            } else {
                console.log('ℹ️ 初始扫描完成，暂未找到含Router的Vue实例');
            }
        }

        // 创建 MutationObserver 持续监控 DOM 变化
        observer = new MutationObserver((mutations) => {
            // 检查是否有新增的元素节点
            let hasNewNodes = false;
            for (const mutation of mutations) {
                if (mutation.type === 'childList' && mutation.addedNodes.length > 0) {
                    hasNewNodes = true;
                    break;
                }
            }

            if (hasNewNodes) {
                // 有新节点添加，尝试获取实例
                // tryGetInstances 内部会判断是否有新 Router 实例，有的话会自动输出
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

    // 后备轮询重试机制
    function startPollingRetry() {
        let delay = 100;
        let detectRemainingTries = 5;

        function executeDetection() {
            // 尝试获取（tryGetInstances 内部会在发现新 Router 实例时自动输出）
            tryGetInstances();

            if (detectRemainingTries > 0) {
                detectRemainingTries--;
                const timeoutId = setTimeout(() => {
                    executeDetection();
                }, delay);
                allTimeoutIds.push(timeoutId);
                delay *= 2;
            } else {
                // 达到最大重试次数，输出轮询阶段统计
                console.log('🏁 轮询阶段结束');
                if (validInstancesCache.length > 0) {
                    console.log(`✅ 轮询阶段找到 ${validInstancesCache.length} 个含Router的Vue实例`);
                    console.log('📋 所有路由详情：');
                    console.table(validInstancesCache.flatMap((inst, idx) =>
                        inst.routes.map(route => ({
                            Instance: idx + 1,
                            Name: route.name || '(unnamed)',
                            Path: route.path
                        }))
                    ));
                } else {
                    console.log('ℹ️ 轮询阶段未找到含Router的Vue实例（MutationObserver将继续监控）');
                }

                // 清理所有定时器
                allTimeoutIds.forEach(id => clearTimeout(id));
                allTimeoutIds = [];
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
        console.log('🚀 Vue & Router 获取脚本启动...');

        // 启动 devtools 消息监听（关键：让 devtools 能够识别）
        listenVueDevtoolsMessage();

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