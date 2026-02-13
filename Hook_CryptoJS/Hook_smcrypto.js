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

// 记录 SM2 doEncrypt
    let raw_doEncrypt;

// 替换 SM2 doEncrypt 的方法
    function my_doEncrypt() {
        let result = Reflect.apply(raw_doEncrypt, this, arguments);
        console.log("SM2 加密明文:", arguments[0]);
        console.log("SM2 加密公钥:", arguments[1]);
        console.log("SM2 加密密文:", result);
        return result;
    }

    // 记录 SM2 doDecrypt
    let raw_doDecrypt;

// 替换 SM2 doDecrypt 的方法
    function my_doDecrypt() {
        let result = Reflect.apply(raw_doDecrypt, this, arguments);
        console.log("SM2 解密密文:", arguments[0]);
        console.log("SM2 解密私钥:", arguments[1]);
        console.log("SM2 解密明文:", result);
        return result;
    }

    // 记录 SM4 doDecrypt
    let raw_sm4_encrypt;

// 替换 SM4 doDecrypt 的方法
    function my_sm4_encrypt() {
        let result = Reflect.apply(raw_sm4_encrypt, this, arguments);
        console.log("SM4 加密明文:", arguments[0]);
        console.log("SM4 加密key:", arguments[1]);
        if (arguments[2] && typeof arguments[2] === "object") {
            if (arguments[2].cipherType) {
                console.log("SM4 加密数据格式:", arguments[2].cipherType);
            }
            if (arguments[2].iv) {
                console.log("SM4 加密iv:", arguments[2].iv);
            }
            if (arguments[2].mode) {
                console.log("SM4 加密模式:", arguments[2].mode);
            }
        }
        return result;
    }

    // 记录 SM4 doDecrypt
    let raw_sm4_decrypt;

// 替换 SM4 doDecrypt 的方法
    function my_sm4_decrypt() {
        let result = Reflect.apply(raw_sm4_decrypt, this, arguments);
        console.log("SM4 解密密文:", arguments[0]);
        console.log("SM4 解密key:", arguments[1]);
        if (arguments[2] && typeof arguments[2] === "object") {
            if (arguments[2].cipherType) {
                console.log("SM4 解密数据格式:", arguments[2].cipherType);
            }
            if (arguments[2].iv) {
                console.log("SM4 解密iv:", arguments[2].iv);
            }
            if (arguments[2].mode) {
                console.log("SM4 解密模式:", arguments[2].mode);
            }
        }
        return result;
    }

    // 记录 SM3 encrypt
    let raw_sm3;

// 替换 SM3 encrypt 的方法
    function my_SM3() {
        let result = Reflect.apply(raw_sm3, this, arguments);
        console.log("SM3 加密明文：:", arguments[0]);
        console.log("SM3 加密密文：:", result);
        return result;
    }


    const raw_call = Function.prototype.call;

    function my_call() {
        const result = Reflect.apply(raw_call, this, arguments);

        // 判断参数是否满足 webpack 的加载条件
        if (arguments.length === 4 && arguments[1]?.exports) {
            const exports = arguments[1].exports;

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
            if (exports.toString().includes('invalid mode')) {
                raw_sm3 = exports;
                arguments[1].exports = my_SM3;
            }

        }

        return result;
    }

    Function.prototype.call = my_call;
})();