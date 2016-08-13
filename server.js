'use strict';

var mongoose = require('mongoose');
var express = require('express');
var bodyParser = require('body-parser');
var sightings = require("./routes/sightings");

mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost/pokenests")
  .then(() =>  console.log('connection succesful'))
  .catch((err) => console.error(err));

var app = express();

app.use(bodyParser.json()); // for parsing application/json
app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

app.use ("/sightings", sightings);

if (app.get('env') === 'development') {
    app.use(function(err, req, res, next) {
        res.status(err.status || 500);
        res.json({
            'error' : {
                message: err.message,
                error: err
            }
        });
    });
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
    res.status(err.status || 500);
    res.json({
        'error' : {
            message: err.message,
            error: {}
        }
    });
});

app.listen(8080, function () {
    console.log('ready...');
});