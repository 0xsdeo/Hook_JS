// ==UserScript==
// @name         模块导出提取注入与路由识别
// @namespace    https://github.com/0xsdeo/Hook_JS
// @version      0.1
// @description  提取模块导出并识别路由规则（打印所有导出内容）
// @author       0xsdeo
// @match        *
// @grant        GM_xmlhttpRequest
// ==/UserScript==

(function() {
    'use strict';

    // 目标模块URL
    const targetModuleUrl = 'http://xxx.xxx.xxx/js/index-yx0_k9LP.js';

    // 获取原始模块代码
    GM_xmlhttpRequest({
        method: "GET",
        url: targetModuleUrl,
        onload: function(response) {
            if (response.status !== 200) {
                console.error('Failed to fetch module:', response.status);
                return;
            }

            const originalCode = response.responseText;

            try {
                // 提取export语句
                const exportData = extractExports(originalCode);

                if (exportData.exports.length > 0) {
                    // 创建新的导入模块
                    createImportModule(exportData, targetModuleUrl);
                } else {
                    console.warn('No exports found in the module');
                }
            } catch (error) {
                console.error('Error processing module:', error);
            }
        },
        onerror: function(error) {
            console.error('Request failed:', error);
        }
    });

    /**
     * 从模块代码中提取export语句
     */
    function extractExports(code) {
        // 匹配export { ... } 语句
        const exportRegex = /export\s*{([^}]+)}/g;
        const matches = [];
        let match;

        while ((match = exportRegex.exec(code)) !== null) {
            matches.push(match[1].trim());
        }

        if (matches.length === 0) {
            return { exports: [], originalExportStatements: [] };
        }

        // 解析导出项
        const exports = [];
        const originalExportStatements = matches;

        matches.forEach(exportBlock => {
            // 分割每个导出项 (格式: "a as b, c as d")
            const items = exportBlock.split(',').map(item => item.trim());

            items.forEach(item => {
                if (item.includes(' as ')) {
                    // 处理 "originalName as exportedName" 格式
                    const [original, exported] = item.split(' as ').map(s => s.trim());
                    exports.push({
                        original: original,
                        exported: exported,
                        type: 'renamed'
                    });
                } else {
                    // 处理直接导出 "name" 格式
                    exports.push({
                        original: item,
                        exported: item,
                        type: 'direct'
                    });
                }
            });
        });

        return {
            exports: exports,
            originalExportStatements: originalExportStatements
        };
    }

    /**
     * 创建新的导入模块
     */
    function createImportModule(exportData, originalModuleUrl) {
        // 生成导入语句
        const importStatements = generateImportStatements(exportData, originalModuleUrl);

        // 生成暴露到全局的代码
        const exposeCode = generateExposeCode(exportData);

        // 生成路由识别代码
        const routeDetectionCode = generateRouteDetectionCode(exportData);

        // 完整的模块代码
        const newModuleCode = `
// 自动生成的模块 - 导入并暴露原始模块的导出
${importStatements}

// 将导入的内容暴露到全局window对象
${exposeCode}

// 打印所有导出内容到控制台
${generateExportPrintingCode(exportData)}

// 路由规则识别
${routeDetectionCode}

console.log('Module exports have been exposed to global scope');
`;

        // 创建并执行新模块
        executeModule(newModuleCode);
    }

    /**
     * 生成导入语句
     */
    function generateImportStatements(exportData, moduleUrl) {
        // 提取所有导出的名称（重命名后的名称）
        const exportNames = exportData.exports.map(exp => exp.exported);

        // 创建导入语句
        return `import { ${exportNames.join(', ')} } from '${moduleUrl}';`;
    }

    /**
     * 生成暴露到全局的代码
     */
    function generateExposeCode(exportData) {
        const assignments = [];

        exportData.exports.forEach(exp => {
            // 将每个导出项赋值给window对象
            assignments.push(`window.${exp.exported} = ${exp.exported};`);
        });

        return assignments.join('\n');
    }

    /**
     * 生成导出内容打印代码
     */
    function generateExportPrintingCode(exportData) {
        const exportNames = exportData.exports.map(exp => exp.exported);

        return `
// 打印所有导出内容
console.log('=== 所有导出内容 ===');
${exportNames.map(name => `
try {
    console.log('${name}:', ${name});
} catch (e) {
    console.log('${name}: [无法访问 - ' + e.message + ']');
}
`).join('')}
console.log('=== 导出内容结束 ===');
`;
    }

    /**
     * 生成路由识别代码
     */
    function generateRouteDetectionCode(exportData) {
        const exportNames = exportData.exports.map(exp => exp.exported);

        return `
// 路由识别功能
(function() {
    // 存储找到的路由规则
    window.detectedRoutes = [];

    // 使用WeakSet来跟踪已访问的对象，防止循环引用
    const visitedObjects = new WeakSet();

    // 路由对象特征识别函数
    function isRouteObject(obj) {
        if (!obj || typeof obj !== 'object' || Array.isArray(obj)) {
            return false;
        }

        // 检查是否具有路由对象的典型属性
        const hasRouteProperties =
            ('path' in obj || 'name' in obj) &&
            ('component' in obj || 'redirect' in obj || 'children' in obj);

        // 检查是否有meta属性（常见于Vue路由）
        const hasMetaProperty = 'meta' in obj && typeof obj.meta === 'object';

        return hasRouteProperties || hasMetaProperty;
    }

    // 递归查找路由对象（修复循环引用问题）
    function findRouteObjects(obj, path, depth = 0) {
        // 防止无限递归，设置最大深度
        if (depth > 20) {
            return;
        }

        // 如果是基本类型或null，直接返回
        if (obj === null || typeof obj !== 'object') {
            return;
        }

        // 检查是否已经访问过该对象（防止循环引用）
        if (visitedObjects.has(obj)) {
            return;
        }

        // 标记为已访问
        visitedObjects.add(obj);

        // 如果是数组，遍历每个元素
        if (Array.isArray(obj)) {
            for (let i = 0; i < obj.length; i++) {
                findRouteObjects(obj[i], path + '[' + i + ']', depth + 1);
            }
            return;
        }

        // 检查当前对象是否是路由对象
        if (isRouteObject(obj)) {
            console.log('发现路由对象:', path, obj);
            window.detectedRoutes.push({
                path: path,
                route: obj
            });

            // 对于路由对象，我们只检查children属性，不再深度递归其他属性
            if (obj.children && Array.isArray(obj.children)) {
                for (let i = 0; i < obj.children.length; i++) {
                    findRouteObjects(obj.children[i], path + '.children[' + i + ']', depth + 1);
                }
            }
            return;
        }

        // 对于非路由对象，继续递归遍历其属性
        // 但限制遍历的属性数量，避免性能问题
        const keys = Object.keys(obj);
        let count = 0;

        for (const key of keys) {
            // 限制每个对象最多遍历50个属性
            if (count > 50) break;

            try {
                const value = obj[key];
                // 跳过函数、null和undefined
                if (value !== null && typeof value === 'object') {
                    findRouteObjects(value, path + '.' + key, depth + 1);
                }
                count++;
            } catch (e) {
                // 忽略访问可能抛出错误的属性
                console.warn('无法访问属性:', key, e);
            }
        }
    }

    // 更安全的路由查找函数，只检查特定的导出项
    function safeFindRoutes() {
        const exportNames = ${JSON.stringify(exportNames)};
        const routeCandidates = [];

        // 首先识别可能包含路由的导出项
        exportNames.forEach(name => {
            const exportedValue = window[name];
            if (exportedValue !== undefined && exportedValue !== null) {
                // 检查是否是路由数组或路由配置对象
                if (Array.isArray(exportedValue) && exportedValue.length > 0) {
                    const firstItem = exportedValue[0];
                    if (firstItem && typeof firstItem === 'object' &&
                        ('path' in firstItem || 'name' in firstItem)) {
                        routeCandidates.push(name);
                    }
                } else if (typeof exportedValue === 'object' &&
                          ('routes' in exportedValue || 'options' in exportedValue)) {
                    routeCandidates.push(name);
                }
            }
        });

        console.log('可能包含路由的导出项:', routeCandidates);

        // 优先检查这些候选项
        routeCandidates.forEach(name => {
            findRouteObjects(window[name], name);
        });

        // 如果没有找到路由，再检查其他所有导出项（但限制深度）
        if (window.detectedRoutes.length === 0) {
            console.log('未在候选项中找到路由，开始全面搜索...');
            exportNames.forEach(name => {
                const exportedValue = window[name];
                if (exportedValue !== undefined && exportedValue !== null &&
                    typeof exportedValue === 'object') {
                    // 限制搜索深度
                    findRouteObjects(exportedValue, name, 0);
                }
            });
        }
    }

    // 延迟执行路由查找，确保所有模块已加载
    setTimeout(() => {
        safeFindRoutes();

        // 输出结果
        if (window.detectedRoutes.length > 0) {
            console.log('共找到 ' + window.detectedRoutes.length + ' 个路由对象:');
            window.detectedRoutes.forEach(routeInfo => {
                console.log('路由路径:', routeInfo.path);
                console.log('路由对象:', routeInfo.route);
            });

            // 将主要的路由信息提取到更易访问的变量中
            const mainRoutes = window.detectedRoutes.filter(routeInfo => {
                const route = routeInfo.route;
                return route.path &&
                      (route.path.startsWith('/') ||
                       route.path.includes(':') ||
                       route.children);
            });

            if (mainRoutes.length > 0) {
                window.mainRoutes = mainRoutes;
                console.log('主要路由:', mainRoutes);
            }
        } else {
            console.log('未找到路由对象');
        }
    }, 100);
})();
`;
    }

    /**
     * 执行新模块
     */
    function executeModule(moduleCode) {
        try {
            // 创建Blob URL
            const blob = new Blob([moduleCode], { type: 'application/javascript' });
            const blobUrl = URL.createObjectURL(blob);

            // 创建并插入script标签
            const script = document.createElement('script');
            script.type = 'module';
            script.src = blobUrl;

            // 添加加载完成事件
            script.onload = function() {
                console.log('Import module loaded successfully');
                URL.revokeObjectURL(blobUrl); // 清理Blob URL

                // 验证导出是否成功
                verifyExports();
            };

            script.onerror = function(error) {
                console.error('Failed to load import module:', error);
                URL.revokeObjectURL(blobUrl);
            };

            document.head.appendChild(script);
        } catch (error) {
            console.error('Error executing module:', error);
        }
    }

    /**
     * 验证导出是否成功
     */
    function verifyExports() {
        console.log('Verifying exports...');

        // 检查路由检测结果
        if (window.detectedRoutes && Array.isArray(window.detectedRoutes)) {
            console.log('路由检测完成，找到 ' + window.detectedRoutes.length + ' 个路由对象');

            if (window.mainRoutes) {
                console.log('主要路由已保存到 window.mainRoutes');
            }
        } else {
            console.warn('路由检测未完成或未找到路由对象');
        }
    }
})();