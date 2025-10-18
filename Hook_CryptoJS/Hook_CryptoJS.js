// ==UserScript==
// @name         Hook_CryptoJS
// @namespace    https://github.com/0xsdeo/Hook_JS
// @version      2025-10-17
// @description  Hook CryptoJS
// @author       0xsdeo
// @match        http://*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // let temp_toString = Function.prototype.toString;
    //
    // Function.prototype.toString = function () {
    //     if (this === Function.prototype.toString) {
    //         return 'function toString() { [native code] }';
    //     } else if (this === xxx) { // 将xxx修改为要hook的方法
    //         return ''; // 在控制台执行xxx.toString()，将输出的内容替换掉空字符串
    //     }
    //     return temp_toString.apply(this, arguments);
    // }

    function hasprop(obj) {
        const requiredProps = [
            'ciphertext',
            'key',
            'iv',
            'algorithm',
            'mode',
            'padding',
            'blockSize',
            'formatter'
        ];

        // 检查对象是否存在且为对象类型
        if (!obj || typeof obj !== 'object') {
            return false;
        }

        // 检查所有必需属性是否存在
        for (const prop of requiredProps) {
            if (!(prop in obj)) {
                return false;
            }
        }

        return true;
    }

    let temp_apply = Function.prototype.apply;

    Function.prototype.apply = function () {
        if (arguments.length === 2 && arguments[1] && typeof arguments[1] === 'object' && arguments[1].length === 1 && hasprop(arguments[1][0])) {
            if (Object.hasOwn(arguments[0],"$super") && Object.hasOwn(arguments[0],"init")) {
                if (this.toString().indexOf('function()') !== -1) {
                    console.log(...arguments);
                    console.log("加密后的密文：",arguments[0].$super.toString.call(arguments[1][0]));
                    console.log("加密Hex key：",arguments[1][0]["key"].toString());
                    if (arguments[1][0]["iv"]) {
                        console.log("加密Hex iv：",arguments[1][0]["iv"].toString());
                    }
                    else{
                        console.log("加密时未用到iv")
                    }
                }
            }
        }
        return temp_apply.call(this, ...arguments);
    }
})();