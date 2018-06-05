/*
 * 向银行发送T0002-01 request
 */
const http = require('http');
const chinaTime = require('china-time');
const iconv = require('iconv-lite');
const xml2js = require('xml-js');

const aesutil = require('../utils/aesutil');

let date = chinaTime('YYYYMMDD');
let time = chinaTime('HHmmss');
let workdate = chinaTime('YYYYMMDD');

let post_data = `<?xml version="1.0" encoding="GBK"?><root><head><transcode>T0002</transcode><transdate>${date}</transdate><transtime>${time}</transtime></head><body><dealtype>01</dealtype><batchno>19</batchno><workdate>${workdate}</workdate><totalcnt>3</totalcnt><totalamt>150</totalamt><note1></note1><note2></note2></body></root>`;
let encrypt_data = aesutil.encrypt(post_data);
console.log('post_data ' + '\n' + post_data);

let options = {
    hostname: '58.216.164.94', //此处不能写协议，如 ： http://,https://  否则会报错  
    port: 2086,
    path: '/TFDService',
    method: 'POST',
    headers: {
        'Content-Type': 'text/plain'
    }
};
let req = http.request(options, function (res) {
    console.log('STATUS:' + '\n' + res.statusCode);
    console.log('HEADERS:' + '\n' + JSON.stringify(res.headers));
    let chunks = [];
    let size = 0;
    res.on('data', function (chunk) {
        chunks.push(chunk);
        size += chunk.length;
    });
    res.on('end', function () {
        let buf = Buffer.concat(chunks, size);
        let str = iconv.decode(buf, 'utf8');
        console.log(str);
        let result = aesutil.decrypt(str);
        console.log('BODY:' + '\n' + result + '\n');
        let result_json = JSON.parse(xml2js.xml2json(result, {compact: true, spaces: 4}));       // is a json object
        console.log('retmsg: ' + result_json.root.head.retmsg._text);
        console.log(result_json.root.body);
    });
});
// write data to request body  
req.write(encrypt_data);
req.end();