'use strict';

var mongoose = require('mongoose');
var bodyParser = require('body-parser');
var sightings = require("./routes/sightings");
var PokemonInfo = require("./models/PokemonInfo");
var FileStreamRotator = require('file-stream-rotator');
var morgan = require('morgan');
var fs = require('fs');
var path = require('path');
var logger = require('./logger');

mongoose.Promise = global.Promise;
mongoose.connect(process.env.DSN_MONGO)
  .then(() =>  logger.info('connection succesful...'))
  .catch((err) => logger.error(err));

PokemonInfo.load(process.env.POKEMON_INFO_FILE)
    .then(() => logger.info("Pokemon info loaded..."));

module.exports.setup = function (app) {

    var logDirectory = path.join(process.cwd(), process.env.LOG_FILE_DIR);

    // ensure log directory exists
    fs.existsSync(logDirectory) || fs.mkdirSync(logDirectory);

    var accessLogStream = FileStreamRotator.getStream({
        date_format: 'YYYYMMDD',
        filename: path.join(logDirectory, 'access-%DATE%.log'),
        frequency: 'daily',
        verbose: false
    })

    app.use(morgan(process.env.MORGAN_LOG_FORMAT, { stream : accessLogStream }));

    app.use(bodyParser.json()); // for parsing application/json
    app.use(bodyParser.urlencoded({ extended: true })); // for parsing application/x-www-form-urlencoded

    app.use ("/sightings", sightings);

    if (process.env.ENV === 'development') {
        app.use(function(err, req, res, next) {
            if (err instanceof Error) {
                err = {
                    message : err.message,
                    stack: err.stack
                };
            }

            logger.error(err);
            res.status(err.status || 500);
            res.json({
                'error' : {
                    message: err.message,
                    error: err,
                }
            });
        });
    }

    // production error handler
    // no stacktraces leaked to user
    app.use(function(err, req, res, next) {
        if (err instanceof Error) {
            err = {
                message : err.message,
                stack: err.stack
            };
        }

        logger.error(JSON.stringify(err));
        res.status(err.status || 500);
        res.json({
            'error' : {
                message: err.message,
                error: {}
            }
        });
    });
};
