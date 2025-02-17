// ==UserScript==
// @name         hook_sessionStorage
// @namespace    https://github.com/0xsdeo/Hook_JS
// @version      2025-02-17
// @description  hook sessionStorage all methods
// @author       0xsdeo
// @match        http://*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let temp_sessionStorage_setItem = sessionStorage.setItem; // 将xxx修改为要hook的方法，temp_xxx变量名可以根据需要进行修改命名

    sessionStorage.setItem = function () { // 将xxx修改为要hook的方法
        console.log(`设置了sessionStorage，键值对为：\n${arguments[0]}:${arguments[1]}`);
        console.log(new Error().stack);
        return temp_sessionStorage_setItem.call(this, ...arguments); // 将网站js调用目标方法时所传入的内容传给原方法执行并返回结果
    }

    let temp_sessionStorage_getItem = sessionStorage.getItem; // 将xxx修改为要hook的方法，temp_xxx变量名可以根据需要进行修改命名

    sessionStorage.getItem = function () { // 将xxx修改为要hook的方法
        console.log("获取了sessionStorage中" + arguments[0] + "键的值：" + temp_sessionStorage_getItem.call(this, ...arguments));
        console.log(new Error().stack);
        return temp_sessionStorage_getItem.call(this, ...arguments); // 将网站js调用目标方法时所传入的内容传给原方法执行并返回结果
    }

    let temp_sessionStorage_removeItem = sessionStorage.removeItem; // 将xxx修改为要hook的方法，temp_xxx变量名可以根据需要进行修改命名

    sessionStorage.removeItem = function () { // 将xxx修改为要hook的方法
        console.log("移除了sessionStorage中" + arguments[0] + "键的值：" + temp_sessionStorage_getItem.call(this, ...arguments));
        console.log(new Error().stack);
        return temp_sessionStorage_removeItem.call(this, ...arguments); // 将网站js调用目标方法时所传入的内容传给原方法执行并返回结果
    }

    let temp_sessionStorage_clear = sessionStorage.clear; // 将xxx修改为要hook的方法，temp_xxx变量名可以根据需要进行修改命名

    sessionStorage.clear = function () { // 将xxx修改为要hook的方法
        console.log("移除了sessionStorage中的所有键值对");
        console.log(new Error().stack);
        return temp_sessionStorage_clear.call(this, ...arguments); // 将网站js调用目标方法时所传入的内容传给原方法执行并返回结果
    }
})();