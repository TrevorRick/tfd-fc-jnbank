var crypto = require('crypto')
    ,fs = require('fs');

function hashAlgorithm(algorithm){
    var s1 = new Date();

    var filename = "package.json";
    var txt = fs.ReadStream(filename);

    var shasum = crypto.createHash(algorithm);
    txt.on('data', function(d) {
        shasum.update(d);
    });

    txt.on('end', function() {
        var d = shasum.digest('hex');
        var s2 = new Date();

        console.log(algorithm+',length:' + d.length);
    });
}

function doHash(hashs){
    hashs.forEach(function(name){
        hashAlgorithm(name);
    })
}

//var algs = crypto.getHashes();
var algs = [ 'DSA',
'DSA-SHA',
'DSA-SHA1',
'DSA-SHA1-old',
'RSA-MD4',
'RSA-MD5',
'RSA-MDC2',
'RSA-RIPEMD160',
'RSA-SHA',
'RSA-SHA1',
'RSA-SHA1-2',
'RSA-SHA224',
'RSA-SHA256',
'RSA-SHA384',
'RSA-SHA512',
'dsaEncryption',
'dsaWithSHA',
'dsaWithSHA1',
'dss1',
'ecdsa-with-SHA1',
'md4',
'md4WithRSAEncryption',
'md5',
'md5WithRSAEncryption',
'mdc2',
'mdc2WithRSA',
'ripemd',
'ripemd160',
'ripemd160WithRSA',
'rmd160',
'sha',
'sha1',
'sha1WithRSAEncryption',
'sha224',
'sha224WithRSAEncryption',
'sha256',
'sha256WithRSAEncryption',
'sha384',
'sha384WithRSAEncryption',
'sha512',
'sha512WithRSAEncryption',
'shaWithRSAEncryption',
'ssl2-md5',
'ssl3-md5',
'ssl3-sha1',
'whirlpool' ];
doHash(algs);