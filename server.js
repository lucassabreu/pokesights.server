#!/bin/env node
'use strict';

require('dotenv').config();
var express = require('express');
var logger = require('./logger');

var app = express();
var server = express();

require('./app.js').setup(app);

server.use("/api/v1", app);

server.listen(process.env.OPENSHIFT_NODEJS_PORT || process.env.SERVER_PORT, function () {
    logger.info('ready...');
});