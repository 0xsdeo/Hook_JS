// ==UserScript==
// @name         Hook_JSEncrypt_RSA_Proxy
// @namespace    https://github.com/0xsdeo/Hook_JS
// @version      2025-10-24
// @description  Hook JSEncrypt RSA using Proxy
// @author       0xsdeo
// @run-at       document-start
// @match        *
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    let u, c = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789+/";
    function f(t) {
        let e, i, r = "";
        for (e = 0; e + 3 <= t.length; e += 3)
            i = parseInt(t.substring(e, e + 3), 16),
                r += c.charAt(i >> 6) + c.charAt(63 & i);
        for (e + 1 == t.length ? (i = parseInt(t.substring(e, e + 1), 16),
            r += c.charAt(i << 2)) : e + 2 == t.length && (i = parseInt(t.substring(e, e + 2), 16),
            r += c.charAt(i >> 2) + c.charAt((3 & i) << 4)); (3 & r.length) > 0; )
            r += "=";
        return r
    }

    function hasRSAProp(obj) {
        const requiredProps = [
            'constructor',
            'getPrivateBaseKey',
            'getPrivateBaseKeyB64',
            'getPrivateKey',
            'getPublicBaseKey',
            'getPublicBaseKeyB64',
            'getPublicKey',
            'parseKey',
            'parsePropertiesFrom'
        ];

        if (!obj || typeof obj !== 'object') {
            return false;
        }

        for (const prop of requiredProps) {
            if (!(prop in obj)) {
                return false;
            }
        }

        return true;
    }

    // 保存原始 call 方法
    const originalCall = Function.prototype.call;

    // 创建 Proxy 来拦截 call 方法
    Function.prototype.call = new Proxy(originalCall, {
        apply: function(target, thisArg, argumentsList) {
            // 检查是否符合 RSA 对象的条件
            if (argumentsList.length === 1 && 
                argumentsList[0] && 
                argumentsList[0].__proto__ && 
                typeof argumentsList[0].__proto__ === 'object' && 
                hasRSAProp(argumentsList[0].__proto__)) {
                
                if ("__proto__" in argumentsList[0].__proto__ && 
                    argumentsList[0].__proto__.__proto__ && 
                    Object.hasOwn(argumentsList[0].__proto__.__proto__, "encrypt") && 
                    Object.hasOwn(argumentsList[0].__proto__.__proto__, "decrypt")) {
                    
                    // Hook encrypt 方法
                    if (argumentsList[0].__proto__.__proto__.encrypt.toString().indexOf('RSA加密') === -1) {
                        let temp_encrypt = argumentsList[0].__proto__.__proto__.encrypt;

                        argumentsList[0].__proto__.__proto__.encrypt = function () {
                            // 使用原始 call 方法来避免递归
                            let encrypt_text = originalCall.call(temp_encrypt, this, ...arguments);

                            console.log("RSA 公钥：\n", this.getPublicKey());
                            console.log("RSA加密 原始数据：", ...arguments);
                            console.log("RSA加密 Base64 密文：", f(encrypt_text));
                            console.log("%c---------------------------------------------------------------------", "color: green;");
                            return encrypt_text;
                        }
                    }

                    // Hook decrypt 方法
                    if (argumentsList[0].__proto__.__proto__.decrypt.toString().indexOf('RSA解密') === -1) {
                        let temp_decrypt = argumentsList[0].__proto__.__proto__.decrypt;

                        argumentsList[0].__proto__.__proto__.decrypt = function () {
                            // 使用原始 call 方法来避免递归
                            let decrypt_text = originalCall.call(temp_decrypt, this, ...arguments);

                            console.log("RSA 私钥：\n", this.getPrivateKey());
                            console.log("RSA解密 Base64 原始数据：", f(...arguments));
                            console.log("RSA解密 明文：", decrypt_text);
                            console.log("%c---------------------------------------------------------------------", "color: green;");
                            return decrypt_text;
                        }
                    }
                }
            }
            
            // 使用 Reflect.apply 来调用原始 call 方法，避免递归
            return Reflect.apply(target, thisArg, argumentsList);
        }
    });
})();