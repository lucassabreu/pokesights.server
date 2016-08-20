'use strict';

require('dotenv').config({silent : true});
var express = require('express');
var logger = require('./logger');

var app = express();
var server = express();

console.log("setup app");
require('./app.js').setup(app);

server.use("/api/v1", app);

console.log(`starting http server at ${process.env.NODE_IP}:${process.env.NODE_PORT}`);
server.listen(process.env.NODE_PORT, process.env.NODE_IP, function () {
    logger.info('ready...');
});