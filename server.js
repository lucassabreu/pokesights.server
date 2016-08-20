#!/bin/node
'use strict';

require('dotenv').config({silent : true});
var express = require('express');
var logger = require('./logger');

var app = express();
var server = express();

require('./app.js').setup(app);

server.use("/api/v1", app);

server.listen(process.env.OPENSHIFT_NODEJS_PORT, process.env.OPENSHIFT_NODEJS_IP, function () {
    logger.info('ready...');
});