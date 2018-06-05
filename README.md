第三方代扣服务API
主要流程如下
场景1 - 签约校准
场景2 - 代扣申请和处理
场景3 - 代扣结果批处理查询
业务逻辑：
所有 request,response报文以xml形式传递，并加密
功能模块化
加密解密：utils/aesutil.js
Usage:

const aesutil = require('../utils/aesutil');
Let encryption = aesutil.decrypt(data);
let decryption = aesutil.decrypt(encryption);
插入数据库：utils/csv_parse.js
路由：
Express 框架，所有银行发起的request由 handler处理，
根据不同的transcode和opertype(或dealtype)执行不同的业务代码。
Usage:
Add a routing path:
// routes/index.js
module.exports = function (app) {
    let index = require('../controllers/index');        
    app.use(‘/index’, index);
};

Map the path to a special controller:
// Controllers/index.js
const express = require('express');
const router = express.Router();

router.post('/', function (req, res) {  
    //业务逻辑
    let data = ‘’;
            res.writeHead(200, {'Content-Type': 'application/xml'});
            res.end(data);
});

module.exports = router;
Some used module:
data2xml:a nice module convert data to xml with interface
Example:
const data2xml = require('data2xml');
const convert = data2xml({
    xmlHeader: '<?xml version="1.0" encoding="GBK"?>\n'
});
let xml = convert(
    'root', {
        head: [{
            'retcode': '000000',
            'retmsg': '查询成功'
        }],
        body: [{
            'batchno': `${batchno}`,
            'totalpagenum': `${totalpagenum}`,
            'nowpagenum': `${nowpagenum}`,
            'pagerownum': `${pagerownum}`,
            'LIST': [{
                    'workdate': '20180523',
                    'serialno': '1',
                    'name': 'xx',
                    'id': 'xxxxx',
                    'amount': 'xxxxx'
                },
                {
                    'workdate': '20180523',
                    'serialno': '2',
                    'name': 'xx',
                    'id': 'xxxxx',
                    'amount': 'xxxxx'
                }
            ]
        }]
    }
);
xml-js :convert between js object and xml text
API reference:
const xml2json = require('xml-js');
result = cxml2json.js2xml(js, options);     // to convert javascript object to xml text
result = xml2json.json2xml(json, options); // to convert json text to xml text
result = xml2json.xml2js(xml, options);    // to convert xml text to javascript object
result = xml2json.xml2json(xml, options);  // to convert xml text to json text
csvtojson:a csv parse to convert csv(from a csv file or string or Asynchronously process each line from csv url) to json object or columnn arrays.
Example:
// convert from a csv file
const csv = require('csvtojson');
csv()
    .fromFile(csvFilePath)
    .then((jsonObj) => {
        console.log(jsonObj);     
    });
eventporxy: 利用事件机制处理复杂的业务逻辑； 循环发起request
Example:
// /*
//  * 模拟第三方发起request
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
let totalcnt = 51;
let totalpagenum = Math.ceil(totalcnt / 10);

ep.after('post_event', `${totalpagenum}`, function (result) {   // callback will be exectud after the event be fired N times.
    for (let index = 0; index < result.length; index++) {
        console.log('pageno: ' + index)
        console.log(result[index].root.body[0].LIST);        
    }
});

for (let currpage = 0; currpage < totalpagenum; currpage++) {
    let post_data = `<?xml version="1.0" encoding="GBK"?><root><head><transcode>T0003</transcode><transdate>${date}</transdate><transtime>${time}</transtime></head><body><batchno>18</batchno><workdate>${date}</workdate><totalcnt>${totalcnt}</totalcnt><currpage>${currpage}</currpage><note1></note1><note2></note2></body></root>`;
    let encrypt_data = aesutil.encrypt(post_data);
    let url = 'http://localhost:5822/withhold';
    
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
