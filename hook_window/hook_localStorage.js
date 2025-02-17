// ==UserScript==
// @name         hook_localStorage
// @namespace    https://github.com/0xsdeo/Hook_JS
// @version      2025-02-17
// @description  hook localStorage all methods
// @author       0xsdeo
// @match        http://*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let temp_localStorage_setItem = localStorage.setItem; // 将xxx修改为要hook的方法，temp_xxx变量名可以根据需要进行修改命名

    localStorage.setItem = function () { // 将xxx修改为要hook的方法
        console.log(`设置了localStorage，键值对为：\n${arguments[0]}:${arguments[1]}`);
        console.log(new Error().stack);
        return temp_localStorage_setItem.call(this, ...arguments); // 将网站js调用目标方法时所传入的内容传给原方法执行并返回结果
    }

    let temp_localStorage_getItem = localStorage.getItem; // 将xxx修改为要hook的方法，temp_xxx变量名可以根据需要进行修改命名

    localStorage.getItem = function () { // 将xxx修改为要hook的方法
        console.log("获取了localStorage中" + arguments[0] + "键的值：" + temp_localStorage_getItem.call(this, ...arguments));
        console.log(new Error().stack);
        return temp_localStorage_getItem.call(this, ...arguments); // 将网站js调用目标方法时所传入的内容传给原方法执行并返回结果
    }

    let temp_localStorage_removeItem = localStorage.removeItem; // 将xxx修改为要hook的方法，temp_xxx变量名可以根据需要进行修改命名

    localStorage.removeItem = function () { // 将xxx修改为要hook的方法
        console.log("移除了localStorage中" + arguments[0] + "键的值：" + temp_localStorage_getItem.call(this, ...arguments));
        console.log(new Error().stack);
        return temp_localStorage_removeItem.call(this, ...arguments); // 将网站js调用目标方法时所传入的内容传给原方法执行并返回结果
    }

    let temp_localStorage_clear = localStorage.clear; // 将xxx修改为要hook的方法，temp_xxx变量名可以根据需要进行修改命名

    localStorage.clear = function () { // 将xxx修改为要hook的方法
        console.log("移除了localStorage中的所有键值对");
        console.log(new Error().stack);
        return temp_localStorage_clear.call(this, ...arguments); // 将网站js调用目标方法时所传入的内容传给原方法执行并返回结果
    }
})();