/*所有银行发起的request都由这个controller handler处理，
 *根据不同的transcode和opertype(或dealtype)执行不同的业务代码
 */
const express = require('express');
const http = require('http');
const iconv = require('iconv-lite');
const path = require('path');
const assert = require('assert');
const request = require('request');
const chinaTime = require('china-time');
const eventproxy = require('eventproxy');
const mongoClient = require('mongodb').MongoClient;
const builder = require('xmlbuilder');

const xml2js = require('xml-js');
const csv = require('csvtojson');
const data2xml = require('data2xml');
const convert = data2xml({
    xmlHeader: '<?xml version="1.0" encoding="GBK"?>'
});

const ep = new eventproxy();

const aesutil = require('../utils/aesutil');
const csvFilePath = path.resolve(__dirname + '/stocks.csv');

/**
 * mongod config
 */
const url = 'mongodb://localhost:27017';
const dbName = 'stock';

const router = express.Router();

var parsePostBody = function (req, done) { // done是一个回掉函数，处理异步函数接口返回的结果chunks
    let chunks = [];
    let size = 0;

    req.on('data', chunk => {
        chunks.push(chunk);
        size += chunk.length;
    });

    req.on('end', () => {
        let buf = Buffer.concat(chunks, size);
        let str = iconv.decode(buf, 'utf8');
        done(str);
    });
};

router.post('/', function (req, res) {
    parsePostBody(req, (body) => {
        console.log('request body: ' + '\n' + body);    // is a string
        let decrypt_body = aesutil.decrypt(body);   // is a xml text
        console.log('decrypt_request_body: ' + '\n' + decrypt_body);    
        let result = xml2js.xml2json(decrypt_body, {compact: true, spaces: 4});
        console.log('decrypt_request_body to json text: ' + '\n' + result);
        let result_json = JSON.parse(result);       // is a json object
        let transcode = result_json.root.head.transcode._text;
        if (transcode == 'T0001') {
	        console.log('****T0001 request from jn bank****');
            let opertype = json_result.root.body.opertype._text,
                name = json_result.root.body.name._text,
                id = json_result.root.body.id._text,
                phone = json_result.root.body.phone._text,
                accno = json_result.root.body.accno._text;
                if (!opertype) {
                    res.send('lose opertype argument, please check!');
                } else if (!name) {
                    res.send('lose name argument, please check!');
                } else if (!id) {
                    res.send('lose id argument, please check!');
                } else if (!phone) {
                    res.send('lose phone argument, please check!');
                } else if (!accno) {
                    res.send('lose accno argument, please check!');
                } else {
                    let data = `<?xml version="1.0" encoding="GBK"?><root><head><retcode>000000</retcode><retmsg>签约登记请求成功，姓名:${name}, id: ${id}, phone: ${phone}, accno: ${accno}</retmsg></head><body><note1></note1><note2></note2></body></root>`;
                    let encrypt_data = aesutil.encrypt(data);
                    res.writeHead(200, {
                        'Content-Type': 'text/plain'
                    });
                    res.end(encrypt_data);
                }   
        } else if (transcode == 'T0002') { // 双向接口
            let dealtype = result_json.root.body.dealtype._text;
            //  01-代扣申请 02-代扣结果 03-签约对账
            if (dealtype == '01') { // 模拟银行对T0002-01（代扣总金额请求） request的response
                let data = '<?xml version="1.0" encoding="GBK"?><root><head><retcode>000000</retcode><retmsg>代扣总金额请求成功</retmsg></head><body><note1></note1><note2></note2></body></root>';
                res.writeHead(200, {
                    'Content-Type': 'application/xml'
                });
                res.end(data);
            } else if (dealtype == '02') { //响应银行发起的T0002-02（代扣总金额结果） request
                console.log('****T0002-02 request from jn bank****');
                let data = '<?xml version="1.0" encoding="GBK"?><root><head><retcode>000000</retcode><retmsg>代扣总金额结果请求成功</retmsg></head><body><note1></note1><note2></note2></body></root>';
                console.log('data: ' + data);
                let encrypt_data = aesutil.encrypt(data);
                res.writeHead(200, {
                    'Content-Type': 'text/plain'
                });
                res.end(encrypt_data);

                
                // 向银行发起T0004 request
                let batchno = result_json.root.body.batchno._text,
                    workdate = result_json.root.body.workdate._text,
                    totalcnt = parseInt(result_json.root.body.totalcnt._text);
                let totalpagenum = Math.ceil(totalcnt / 10);
                let date = chinaTime('YYYYMMDD');
                let time = chinaTime('HHmmss');
                console.log('****T0004 request to jn bank****');
                console.log('totalpagenum: ' + '\n'+ totalpagenum);

                for (let currpage = 0; currpage < totalpagenum; currpage++) {
                    let post_data = `<?xml version="1.0" encoding="GBK"?><root><head><transcode>T0004</transcode><transdate>${date}</transdate><transtime>${time}</transtime></head><body><batchno>${batchno}</batchno><workdate>${workdate}</workdate><totalcnt>${totalcnt}</totalcnt><currpage>${currpage}</currpage><note1></note1><note2></note2></body></root>`;
                    let encrypt_data = aesutil.encrypt(post_data);

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
                        let chunks = [];
                        let size = 0;
                        console.log('STATUS:' + '\n' + res.statusCode);
                        console.log('HEADERS:' + '\n' + JSON.stringify(res.headers));
                        res.on('data', chunk => {   // chunk是一个Buffer对象
                            chunks.push(chunk);
                            size += chunk.length;
                        });
                        res.on('end', () => {
                            let buf = Buffer.concat(chunks, size);
                            let str = iconv.decode(buf, 'utf8');
                            console.log('str: ' + '\n' + str);
                            let result = aesutil.decrypt(str);
                            console.log('BODY:' + '\n' + result + '\n');
                            let result_json = JSON.parse(xml2js.xml2json(result, {compact: true, spaces: 4}));       // is a json object
                            console.log('retmsg: ' + result_json.root.head.retmsg._text);
                            console.log(result_json.root.body.LIST);
                        })
                    });                           
                    req.write(encrypt_data);
                    req.end();
                }
            } else if (dealtype == '03') { // 响应银行发起的T0002-03（签约校准请求） request  
                console.log('****T0002-03 request from jn bank****');
                let workdate = json_result.root.body.workdate._text,
                    batchno = json_result.root.body.batchno._text,
                    totalcnt = json_result.root.body.totalcnt._text

                if (!workdate) {
                    console.log('lose workdate argument, please check!');
                } else if (!totalcnt){
                    console.log('lose totalcnt argument, please check!');
                } else {
                    console.log('T0002-03 request body batchno: ' + '\n' + json_result.root.body.batchno._text);
                    let data = `<?xml version="1.0" encoding="GBK"?><root><head><retcode>000000</retcode><retmsg>签约校准请求成功，总笔数: ${totalcnt}</retmsg></head><body><note1></note1><note2></note2></body></root>`;
                    res.writeHead(200, {
                        'Content-Type': 'text/plain'
                    });
                    let encrypt_data = aesutil.encrypt(data);
                    res.end(encrypt_data);

                    // 向银行发起T0005 request
                    let totalpagenum = Math.ceil(totalcnt / 10);
                    let date = chinaTime('YYYYMMDD');
                    let time = chinaTime('HHmmss');
                    console.log('****T0005 request to jn bank****');
                    console.log('totalpagenum: ' + '\n'+ totalpagenum);
                    
                    for (let currpage = 0; currpage < totalpagenum; currpage++) {
                        let post_data = `<?xml version="1.0" encoding="GBK"?><root><head><transcode>T0005</transcode><transdate>${date}</transdate><transtime>${time}</transtime></head><body><batchno>${batchno}</batchno><workdate>${workdate}</workdate><totalcnt>${totalcnt}</totalcnt><currpage>${currpage}</currpage><note1></note1><note2></note2></body></root>`;
                        let encrypt_data = aesutil.encrypt(post_data);

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
                            let chunks = [];
                            let size = 0;
                            console.log('STATUS:' + '\n' + res.statusCode);
                            console.log('HEADERS:' + '\n' + JSON.stringify(res.headers));
                            res.on('data', chunk => {   // chunk是一个Buffer对象
                                chunks.push(chunk);
                                size += chunk.length;
                            });
                            res.on('end', () => {
                                let buf = Buffer.concat(chunks, size);
                                let str = iconv.decode(buf, 'utf8');
                                console.log('str: ' + '\n' + str);
                                let result = aesutil.decrypt(str);
                                console.log('BODY:' + '\n' + result + '\n');
                                let result_json = JSON.parse(xml2js.xml2json(result, {compact: true, spaces: 4}));       // is a json object
                                console.log('retmsg: ' + result_json.root.head.retmsg._text);
                                console.log(result_json.root.body.LIST);
                            })
                        });                           
                        req.write(encrypt_data);
                        req.end();
                    }

                    // 插入数据库
                    // mongoClient.connect(url, function (err, client) {
                    //     assert.equal(null, err);
                    //     console.log('Connected correctly to server');
                        
                    //     const db = client.db(dbName);
                    //     db.createCollection('batchrecords', {
                    //         'capped': true,
                    //         'size': 100000,
                    //         'max': 5000
                    //     }, function (err, collection) {
                    //         assert.equal(err, null);
                    //         console.log('Collection created.');
                    //         // 指定一条记录的格式  
                    //         let json = {
                    //             batchno: `${batchno}`,
                    //             totalcnt: `${totalcnt}`
                    //         };
                    //         // 存入数据库  
                    //         collection.insert(json, function (err, result) {
                    //             assert.equal(err, null);
                    //             console.log(result);
                    //             client.close();
                    //         });
                    //     });
                    // });
                }
            } else {
                res.send('unknown T0002 dealtype, please check!');
            }
        } else if (transcode == 'T0003') { // 响应银行发起的（代扣明细信息查询） request。response格式暂时是从xml文件中读取返回
            console.log('****T0003 request from jn bank****');
            let batchno = result_json.root.body.batchno._text,
                workdate = result_json.root.body.workdate._text,
                totalcnt = parseInt(result_json.root.body.totalcnt._text),
                currpage = parseInt(result_json.root.body.currpage._text);        
            let totalpagenum = Math.ceil(totalcnt / 10);
            let nowpagenum = currpage + 1;

            // convert a csv text to json boject
            csv()
                .fromFile(csvFilePath)
                .then((jsonObj) => {
                    let user_list = [];
                    let j = 0;  // user number per page
                    for (let i = 0; i < jsonObj.length; i++) {
                        if (jsonObj[i].workdate == `${workdate}` && jsonObj[i].batchno == `${batchno}` && jsonObj[i].pageno == `${nowpagenum}`) {                           
                            j++;
                            user_list.push(jsonObj[i]);
                        }
                    };

                    // use xml-builder module to create a xml document
                    let xml = builder.create('root', { encoding: 'GBK'})
                    .ele('head')
                        .ele('retcode', '000000').up()
                        .ele('retmsg', '代扣明细信息查询请求成功').up()
                    .up()
                    .ele('body')
                        .ele('batchno', `${batchno}`).up()
                        .ele('totalpagenum', `${totalpagenum}`).up() 
                        .ele('nowpagenum', `${nowpagenum}`).up()
                        .ele('pagerownum', `${j}`).up()
                    for (var i = 0; i < j; i++) {
                        // Create an XML fragment
                        LIST = builder.create('LIST').ele('workdate', `${workdate}`).up()
                                                     .ele('serialno', user_list[i].serialno).up()
                                                     .ele('name',user_list[i].name).up()
                                                     .ele('id',user_list[i].id).up()
                                                     .ele('amount',user_list[i].amount).up()
                        // Import the root node of the fragment after
                        // the people node of the main XML document
                        xml.importDocument(LIST);
                    }
                let decryption_xmlresult = aesutil.encrypt(xml.end({ pretty: true}));
                res.writeHead(200, {
                    'Content-Type': 'text/plain'
                });
                res.end(decryption_xmlresult);
                console.log(xml.end({ pretty: true}));
                })
        } else if (transcode == 'T0004') { // 模拟银行对（代扣结果查询）request的响应
            let batchno = result.root.body.batchno._text,
                totalpagenum = Math.ceil(result.root.body[0].totalcnt / 10),
                nowpagenum = result.root.body.currpage._text;
            let data = `<?xml version="1.0" encoding="GBK"?><root><head><retcode>000000</retcode><retmsg>批扣结果查询成功</retmsg></head><body><batchno>${batchno}</batchno><totalpagenum>${totalpagenum}</totalpagenum><nowpagenum>${nowpagenum}</nowpagenum><pagerownum>10</pagerownum><LIST></LIST><LIST></LIST><note1></note1><note2></note2></body></root>`;
            res.writeHead(200, {
                'Content-Type': 'application/xml'
            });
            res.end(data);
        } else if (transcode == 'T0005') { // 模拟银行对T0005 request的response。
            let batchno = result.root.body.batchno._text,
                totalpagenum = Math.ceil(result.root.body.totalcnt._text / 10),
                nowpagenum = result.root.body.currpage._text;
            let data = `<?xml version="1.0" encoding="GBK"?><root><head><retcode>000000</retcode><retmsg>签约校准查询请求成功</retmsg></head><body><batchno>${batchno}</batchno><totalpagenum>${totalpagenum}</totalpagenum><nowpagenum>${nowpagenum}</nowpagenum><pagerownum>10</pagerownum><LIST></LIST><LIST></LIST><note1></note1><note2></note2></body></root>`;
            let decrypt_data = aesutil.decrypt(data);
            res.writeHead(200, {
                'Content-Type': 'text/plain'
            });
            res.end(decrypt_data);
        } else {
            res.end('unknown transcode');
        }
    });
})

module.exports = router;
