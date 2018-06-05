// const fs = require('fs');
const express = require('express');
// const path = require('path');

// const bodyParser = require('body-parser');

const config = require('./config');
// const json_xml = require('./json_xml');

const app = express();

let routes = require('./routes/index');
routes(app);

// app.use(json_xml.middleware);
// app.use(bodyParser.json( { type: 'application/xml'}));
process.on('uncaughtException', error => {
    console.log(error);
});

app.set('port',(config.port || 3000));
app.listen(app.get('port'),function(){
    console.log('Server listening on port:',app.get('port'));
});  

