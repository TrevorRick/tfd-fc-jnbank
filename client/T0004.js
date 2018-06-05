// /*
//  * 向银行发送T0004 request
//  *
const request = require('request');
const chinaTime = require('china-time');
const eventproxy = require('eventproxy');
const xml2js = require('xml2js');
const parser = xml2js.Parser();

const aesutil = require('../utils/aesutil');

const ep = new eventproxy();

let date = chinaTime('YYYYMMDD');
let time = chinaTime('HHmmss');
let totalcnt = 41;
let totalpagenum = Math.ceil(totalcnt / 10);

ep.after('post_event', `${totalpagenum}`, function (result) {   // callback will be exectud after the event be fired N times.
    for (let index = 0; index < result.length; index++) {
        console.log(result[index].root.body[0].nowpagenum[0] + ', ' + result[index].root.body[0].totalpagenum[0] );        
    }
});

for (let currpage = 0; currpage < totalpagenum; currpage++) {
    let post_data = `<?xml version="1.0" encoding="GBK"?><root><head><transcode>T0004</transcode><transdate>${date}</transdate><transtime>${time}</transtime></head><body><batchno>18</batchno><workdate>${date}</workdate><totalcnt>${totalcnt}</totalcnt><currpage>${currpage}</currpage><note1></note1><note2></note2></body></root>`;
    let encrypt_data = aesutil.encrypt(post_data);
    let url = 'http://58.216.164.94:2086/TFDService';
    
    request({
        url: url,
        method: 'POST',
        headers: {
            'Content-Type': 'text/plain'
        },
        body: encrypt_data
    }, function (err, response, body) {  
        if (!err && response.statusCode == 200) {
            parser.parseString(body, function (err, result) {
                ep.emit('post_event', result);      // emit event, tell ep instance this event has bee done.
            });       
        }
    });
}

