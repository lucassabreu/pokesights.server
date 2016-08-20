'use strict';

var contentTypes = require('./utils/content-types');
var sysInfo      = require('./utils/sys-info');

var express = require('express');
var router = express.Router();

var status = function (req, res, next) {
    // IMPORTANT: Your application HAS to respond to GET /health with status 200
    //            for OpenShift health monitoring
    var url = req.url;
    if (url == '/health') {
        res.writeHead(200);
        res.end();
        return;
    } else if (url == '/info/gen' || url == '/info/poll') {
        res.setHeader('Content-Type', 'application/json');
        res.setHeader('Cache-Control', 'no-cache, no-store');
        res.end(JSON.stringify(sysInfo[url.slice(6)]()));
        return;
    }
};

router.all('/health', status);
router.all('/info/gen', status);
router.all('/info/poll', status);

module.exports.setup = function (app) {
    app.use(express.static('static'));
    app.use(router);
};