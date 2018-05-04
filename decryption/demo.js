const aseutil = require('./aesutil.js');
const fs = require('fs');
const path = require('path');
const assert = require('assert');


// var data = "测试01!@#";
var readstream = fs.createReadStream(path.resolve(__dirname + '/data'))
var data = [];
readstream.on('data', function (chunk) {
    data.push(chunk.toString());
})
readstream.on('end', function () {
    console.log('final output: ' + data);
    data = data.toString();
    assert.equal(typeof data, 'string');

    var key = "RwcmlVpg";
    var iv = "4e5Wa71fYoT7MFEX1";       
    var hashkey = aseutil.maphash(key);
    var hashiv = aseutil.maphash(iv, 'MD5');
    
    var encryption = aseutil.encryption(data, hashkey, hashiv);
    console.log( "base64 ciphertext: "+ encryption);

    var decryption = aseutil.decryption(encryption, hashkey, hashiv);
    console.log( "UTF8 plaintext deciphered: " + decryption);
    
})

// var key = "RwcmlVpg";
// var iv = "4e5Wa71fYoT7MFEX1";       

// var hashkey = aseutil.maphash(key);

// var hashiv = aseutil.maphash(iv, 'MD5');

// var encryption = aseutil.encryption(data, hashkey, hashiv);
// console.log( "base64 ciphertext: "+ encryption);

// var decryption = aseutil.decryption(encryption, hashkey, hashiv);
// console.log( "UTF8 plaintext deciphered: " + decryption);