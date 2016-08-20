'use strict';

require('dotenv').config({silent : true});
var express = require('express');
var logger = require('./logger');
var contentTypes = require('./utils/content-types');
var sysInfo      = require('./utils/sys-info');

var app = express();
var openshift = express();
var server = express();

console.log("setup openshift");
require('./openshift.js').setup(openshift);

console.log("setup app");
require('./app.js').setup(app);

server.use("/", openshift);
server.use("/api/v1", app);

console.log(`starting http server at ${process.env.NODE_IP}:${process.env.NODE_PORT}`);
server.listen(process.env.NODE_PORT, process.env.NODE_IP, function () {
    logger.info('ready...');
});