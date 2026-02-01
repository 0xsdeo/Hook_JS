// ==UserScript==
// @name         Hook_smcrypto
// @namespace    http://tampermonkey.net/
// @version      2026-02-01
// @description  try to take over the world!
// @author       LoveCode && 0xsdeo
// @match        https://*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

// 记录真正的 doEncrypt
    let raw_doEncrypt;

// 替换 doEncrypt 的方法
    function my_doEncrypt(...args) {
        let result = Reflect.apply(raw_doEncrypt, this, args);
        console.log("SM2 加密明文:", args[0]);
        console.log("SM2 加密公钥:", args[1]);
        console.log("SM2 加密密文:", result);
        return result;
    }

    // 记录真正的 doDecrypt
    let raw_doDecrypt;

// 替换 doDecrypt 的方法
    function my_doDecrypt(...args) {
        let result = Reflect.apply(raw_doDecrypt, this, args);
        console.log("SM2 解密密文:", args[0]);
        console.log("SM2 解密私钥:", args[1]);
        console.log("SM2 解密明文:", result);
        return result;
    }

    // 记录真正的 doDecrypt
    let raw_sm4_encrypt;

// 替换 doDecrypt 的方法
    function my_sm4_encrypt(...args) {
        let result = Reflect.apply(raw_sm4_encrypt, this, args);
        console.log("SM4 加密明文:", args[0]);
        console.log("SM4 加密key:", args[1]);
        if (args[2] && typeof args[2] === "object") {
            if (args[2].cipherType) {
                console.log("SM4 加密数据格式:", args[2].cipherType);
            }
            if (args[2].iv) {
                console.log("SM4 加密iv:", args[2].iv);
            }
            if (args[2].mode) {
                console.log("SM4 加密模式:", args[2].mode);
            }
        }
        return result;
    }

    // 记录真正的 doDecrypt
    let raw_sm4_decrypt;

// 替换 doDecrypt 的方法
    function my_sm4_decrypt(...args) {
        let result = Reflect.apply(raw_sm4_decrypt, this, args);
        console.log("SM4 解密密文:", args[0]);
        console.log("SM4 解密key:", args[1]);
        if (args[2] && typeof args[2] === "object") {
            if (args[2].cipherType) {
                console.log("SM4 解密数据格式:", args[2].cipherType);
            }
            if (args[2].iv) {
                console.log("SM4 解密iv:", args[2].iv);
            }
            if (args[2].mode) {
                console.log("SM4 解密模式:", args[2].mode);
            }
        }
        return result;
    }


    const raw_call = Function.prototype.call;

    function my_call(...args) {
        const result = Reflect.apply(raw_call, this, args);

        // 判断参数是否满足 webpack 的加载条件
        if (args.length === 4 && args[1]?.exports) {
            const exports = args[1].exports;

            if (exports.doEncrypt) {
                raw_doEncrypt = exports.doEncrypt;
                exports.doEncrypt = my_doEncrypt;
            }
            if (exports.doDecrypt) {
                raw_doDecrypt = exports.doDecrypt;
                exports.doDecrypt = my_doDecrypt;
            }
            if (exports.encrypt) {
                raw_sm4_encrypt = exports.encrypt;
                exports.encrypt = my_sm4_encrypt;
            }
            if (exports.decrypt) {
                raw_sm4_decrypt = exports.decrypt;
                exports.decrypt = my_sm4_decrypt;
            }

        }

        return result;
    }

    Function.prototype.call = my_call;
})();