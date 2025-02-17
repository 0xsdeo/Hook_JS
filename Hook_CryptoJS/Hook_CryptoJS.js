// ==UserScript==
// @name         Hook_CryptoJS
// @namespace    https://github.com/0xsdeo/Hook_JS
// @version      2025-01-11
// @description  Hook CryptoJS
// @author       0xsdeo
// @match        http://*/*
// @icon         data:image/gif;base64,R0lGODlhAQABAAAAACH5BAEKAAEALAAAAAABAAEAAAICTAEAOw==
// @grant        none
// ==/UserScript==

(function () {
    'use strict';

    // crypto-js/md5
    // crypto-js/sha1
    // crypto-js/sha256
    // crypto-js/sha224
    // crypto-js/sha512
    // crypto-js/sha384
    // crypto-js/sha3
    // crypto-js/ripemd160

    let md5_encrypt = CryptoJS.MD5;
    CryptoJS.MD5 = function (encrypt_text) {
        console.log("md5加密字符串:", encrypt_text);
        console.log("md5加密后:", md5_encrypt(encrypt_text).toString());
        console.log(new Error().stack);
        return md5_encrypt(encrypt_text);
    }

    let SHA1_encrypt = CryptoJS.SHA1;
    CryptoJS.SHA1 = function (encrypt_text) {
        console.log("SHA1加密:", encrypt_text);
        console.log("SHA1加密后:", SHA1_encrypt(encrypt_text).toString());
        console.log(new Error().stack);
        return SHA1_encrypt(encrypt_text);
    }

    let SHA256_encrypt = CryptoJS.SHA256;
    CryptoJS.SHA256 = function (encrypt_text) {
        console.log("SHA256加密:", encrypt_text);
        console.log("SHA256加密后:", SHA256_encrypt(encrypt_text).toString());
        console.log(new Error().stack);
        return SHA256_encrypt(encrypt_text);
    }

    let SHA512_encrypt = CryptoJS.SHA512;
    CryptoJS.SHA512 = function (encrypt_text) {
        console.log("SHA512加密:", encrypt_text);
        console.log("SHA512加密后:", SHA512_encrypt(encrypt_text).toString());
        console.log(new Error().stack);
        return SHA512_encrypt(encrypt_text);
    }

    let SHA224_encrypt = CryptoJS.SHA224;
    CryptoJS.SHA224 = function (encrypt_text) {
        console.log("SHA224加密:", encrypt_text);
        console.log("SHA224加密后:", SHA224_encrypt(encrypt_text).toString());
        console.log(new Error().stack);
        return SHA224_encrypt(encrypt_text);
    }

    let SHA384_encrypt = CryptoJS.SHA384;
    CryptoJS.SHA384 = function (encrypt_text) {
        console.log("SHA384加密:", encrypt_text);
        console.log("SHA384加密后:", SHA384_encrypt(encrypt_text).toString());
        console.log(new Error().stack);
        return SHA384_encrypt(encrypt_text);
    }

    let SHA3_encrypt = CryptoJS.SHA3;
    CryptoJS.SHA3 = function (encrypt_text) {
        console.log("SHA3加密:", encrypt_text);
        console.log("SHA3加密后:", SHA3_encrypt(encrypt_text).toString());
        console.log(new Error().stack);
        return SHA3_encrypt(encrypt_text);
    }

    let RIPEMD160_encrypt = CryptoJS.RIPEMD160;
    CryptoJS.RIPEMD160 = function (encrypt_text) {
        console.log("RIPEMD160加密:", encrypt_text);
        console.log("RIPEMD160加密后:", RIPEMD160_encrypt(encrypt_text).toString());
        console.log(new Error().stack);
        return RIPEMD160_encrypt(encrypt_text);
    }

    // crypto-js/aes
    // crypto-js/tripledes
    // crypto-js/rc4
    // crypto-js/rabbit
    // crypto-js/rabbit-legacy
    // crypto-js/evpkdf

    let AES_encrypt = CryptoJS.AES.encrypt;
    CryptoJS.AES.encrypt = function () {
        console.log("AES加密:", arguments[0]);
        console.log("AES加密的密钥:", arguments[1]);
        if (typeof arguments[2] !== undefined) {
            console.log("AES加密参数配置：", arguments[2]);
        }
        let result = AES_encrypt.apply(this, arguments).toString();
        console.log("AES加密后:", result);
        console.log(new Error().stack);
        return result;
    }

    let AES_decrypt = CryptoJS.AES.decrypt;
    CryptoJS.AES.decrypt = function () {
        console.log("AES解密:", arguments[0]);
        console.log("AES解密的密钥:", arguments[1]);
        if (typeof arguments[2] !== undefined) {
            console.log("AES解密参数配置", arguments[2]);
        }
        let result = AES_decrypt.apply(this, arguments).toString();
        console.log("AES解密后:", result);
        console.log(new Error().stack);
        return result;
    }
})();