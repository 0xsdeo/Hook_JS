// ==UserScript==
// @name         0xsdeo
// @namespace    https://github.com/0xsdeo/Hook_JS
// @version      2025-03-07
// @description  绕过js检测代码是否被格式化过
// @author       0xsdeo
// @version      v0.1
// @match        http://*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function() {
    'use strict';

    let temp_toString = Function.prototype.toString;

    Function.prototype.toString = function () {
        let toString_result = temp_toString.apply(this, arguments);
        if (this === Function.prototype.toString) {
            return 'function toString() { [native code] }';
        } else {
            if (typeof toString_result == "string") {
                toString_result = toString_result.replace(/\s/g, '');
                if (toString_result.slice(0, 8) === 'function') {
                    toString_result = toString_result.slice(0, 8) + ' ' + toString_result.slice(8);
                }
            }
            return toString_result;
        }
    }
})();