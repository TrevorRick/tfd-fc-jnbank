// /*
//  * 模拟银行发送的T0003（代扣明细信息查询）request
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
let totalcnt = 3;
let totalpagenum = Math.ceil(totalcnt / 10);

ep.after('post_event', `${totalpagenum}`, function (result) {   // callback will be exectud after the event be fired N times.
    for (let index = 0; index < result.length; index++) {
        console.log('pageno: ' + index);
        console.log(result[index].root.body[0].LIST);        
    }
});

for (let currpage = 0; currpage < totalpagenum; currpage++) {
    let post_data = `<?xml version='1.0' encoding='GBK'?><root><body><batchno>19</batchno><workdate>20180601</workdate><totalcnt>3</totalcnt><currpage>0</currpage><note1></note1><note2></note2></body><head><transcode>T0003</transcode><transdate>20180601</transdate><transtime>173310</transtime></head></root>`;
    let encrypt_data = aesutil.encrypt(post_data);
    let url = '';
    
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
                let nowpagenum = result.root.body[0].nowpagenum[0],
                    totalpagenum = result.root.body[0].totalpagenum[0];
                if (nowpagenum < totalpagenum) {
                    ep.emit('post_event', result);      // emit event, tell ep instance this event has bee done.
                }
            });       
        }
    });
}

