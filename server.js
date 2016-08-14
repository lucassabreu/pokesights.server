'use strict';

var express = require('express');
require('dotenv').config({silent: true});
var logger = require('./logger');

var app = express();
var server = express();

require('./app.js').setup(app);

server.use("/api/v1", app);

server.listen(8080, function () {
    logger.info('ready...');
});