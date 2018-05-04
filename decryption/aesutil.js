/**
 * key-->sha-->buffer
 * iv-->md5-->buffer
 * algorithm=aes-256-cbc
 */
var crypto = require('crypto');

var aesutil = module.exports = {};
aesutil.maphash = function (data, algorithm) {
    var algorithm = arguments[1]? arguments[1] : 'sha256'
    var hash= crypto.createHash(algorithm)
    hash.update(data);
    return hash.digest();       //hash.digest([encoding]),The encoding can be 'hex', 'latin1' or 'base64'. 
                                //If encoding is provided a string will be returned; otherwise a Buffer is returned.
}



aesutil.encryption = function (data, key, iv) {
    console.log('Original cleartext: ' + data);
    iv = iv || '';
    var algorithm = 'AES-256-CBC';
    var clearEncoding = 'utf8';
    var cipherEncoding = 'base64';
    var cipherChunks = [];
    var cipher = crypto.createCipheriv(algorithm, key, iv);
    // cipher.setAutoPadding(true);
    cipherChunks.push(cipher.update(data, clearEncoding, cipherEncoding));
    cipherChunks.push(cipher.final(cipherEncoding));
    return cipherChunks.join('');
}

aesutil.decryption = function (cipherChunks, key, iv) {
    if (!cipherChunks) {
        return "";
    }
    iv = iv || "";
    var algorithm = 'AES-256-CBC';
    var clearEncoding = 'utf8';
    var cipherEncoding = 'base64';
    var plainChunks = [];
    var decipher = crypto.createDecipheriv(algorithm, key, iv);
    decipher.setAutoPadding(true);
    plainChunks.push(decipher.update(cipherChunks, cipherEncoding, clearEncoding));
    plainChunks.push(decipher.final(clearEncoding));
    return plainChunks.join('');
}



// var crypto = require('crypto')
//     ,fs = require('fs');

// function hashAlgorithm(algorithm){
//     var s1 = new Date();

//     var filename = "package.json";
//     var txt = fs.ReadStream(filename);

//     var shasum = crypto.createHash(algorithm);
//     txt.on('data', function(d) {
//         shasum.update(d);
//     });

//     txt.on('end', function() {
//         var d = shasum.digest('hex');
//         var s2 = new Date();

//         console.log(algorithm+','+(s2-s1) +'ms,'+ d);
//     });
// }

// function doHash(hashs){
//     hashs.forEach(function(name){
//         hashAlgorithm(name);
//     })
// }

// //var algs = crypto.getHashes();
// var algs = [ 'md5','sha','sha1','sha256','sha512','RSA-SHA','RSA-SHA1','RSA-SHA256','RSA-SHA512'];
// doHash(algs);