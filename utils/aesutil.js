/**
 * 将加密解密的功能封装成一个模块，以模块的函数接口形式暴露出去，函数返回值为加密解密后的数据
 * key-->sha-->buffer
 * iv-->md5-->buffer
 * algorithm=aes-256-cbc
 */
const crypto = require('crypto');
const config = require('../config');

const aesutil = module.exports = {};

let maphash = function (data, algorithm) {
    var algo = algorithm ? algorithm : 'sha256';
    let hash = crypto.createHash(algo);
    hash.update(data);
    return hash.digest(); //hash.digest([encoding]),The encoding can be 'hex', 'latin1' or 'base64'. 
    //If encoding is provided a string will be returned; otherwise a Buffer is returned.
};

aesutil.encrypt = function (data) {
    // console.log('Original cleartext: ' + '\n' + data);
    let key = config.key || '';
    let iv = config.iv || '';
    let algorithm = config.algorithm,
        clearEncoding = config.clearEncoding,
        cipherEncoding = config.cipherEncoding,
        cipherChunks = [];
    let cipher = crypto.createCipheriv(algorithm, maphash(key), maphash(iv, config.addalgorithm));
    cipherChunks.push(cipher.update(data, clearEncoding, cipherEncoding));
    cipherChunks.push(cipher.final(cipherEncoding));
    return cipherChunks.join('');   
};

aesutil.decrypt = function (cipherChunks) {
    if (!cipherChunks) {
        return '';
    }
    let key = config.key || '';
    let iv = config.iv || '';
    let algorithm = config.algorithm,
        clearEncoding = config.clearEncoding,
        cipherEncoding = config.cipherEncoding,
        plainChunks = [];
    let decipher = crypto.createDecipheriv(algorithm, maphash(key), maphash(iv, config.addalgorithm));
    plainChunks.push(decipher.update(cipherChunks, cipherEncoding, clearEncoding));
    plainChunks.push(decipher.final(clearEncoding));
    return plainChunks.join('');
};

