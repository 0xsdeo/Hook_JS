// ==UserScript==
// @name         Hook_outerHTML
// @namespace    https://github.com/0xsdeo/Hook_JS
// @version      2025-01-22
// @description  Hook outerHTML to find XSS
// @author       0xsdeo
// @match        http://*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let property_accessor = Object.getOwnPropertyDescriptor(Element.prototype, "outerHTML"); // 获取目标属性访问器描述符
    let get_accessor = property_accessor.get; // 获取getter
    let set_accessor = property_accessor.set; // 获取setter

    Object.defineProperty(Element.prototype, "outerHTML", {
        get: function () {
            // 在这里写你想让hook后的属性在被获取值时执行的代码
            return get_accessor.call(this); // 当网站js获取目标属性值时调用原属性getter返回结果
        },
        set: function () {
            if (arguments.length === 1) {
                console.log(arguments[0]);
            }
            set_accessor.call(this, ...arguments);// 将网站js设置目标属性值时所传入的内容传给原setter设置并返回结果
        }
    });
})();