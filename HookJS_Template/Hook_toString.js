// ==UserScript==
// @name         New Userscript
// @namespace    http://tampermonkey.net/
// @version      2025-01-05
// @description  try to take over the world!
// @author       You
// @match        http://*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let temp_toString = Function.prototype.toString;

    Function.prototype.toString = function () {
        if (this === Function.prototype.toString) {
            return 'function toString() { [native code] }';
        } else if (this === xxx) { // 将xxx修改为要hook的方法
            return ''; // 在控制台执行xxx.toString()，将输出的内容替换掉空字符串
        }
        return temp_toString.apply(this, arguments);
    }
})();