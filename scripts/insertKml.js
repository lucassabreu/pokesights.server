require('dotenv').config({silent: true});
var mongoose = require('mongoose');
var Sighting = require("./models/Sighting");
var xml2js = require('xml2js');
var fs = require('fs');
var PokemonInfo = require("./models/PokemonInfo");
var parser = new xml2js.Parser();
var util = require('util');
var logger = require("./logger");

var sightings = [];

function insertSighting (s) {

    logger.info(util.format("%s/%s - completed", s, sightings.length));

    if (sightings.length <= s) {
        logger.info("Done !");
        process.exit();
        return;
    }

    Sighting.addSighting(sightings[s])
        .then((r) => insertSighting(++s))
        .catch((err) => logger.error("erro no insert: ", err));
}

mongoose.Promise = global.Promise;
PokemonInfo.load(process.cwd() + process.env.POKEMON_INFO_FILE)
    .then (function () {
        mongoose.connect(process.env.DSN_MONGO)
            .then(function() {

                fs.readFile(__dirname + '/../mymap.kml', function(err, data) {
                    parser.parseString(data, function (err, r) {
                        if (err)
                            console.log("inserting error ", err);

                        var folders = r.kml.Document[0].Folder;
                        for(var f in folders) {
                            var placemarks = folders[f].Placemark;
                            for(var p in placemarks) {
                                var sights = parseInt(placemarks[p].ExtendedData[0].Data[1].value[0]);
                                for(; sights > 0; sights--) {
                                    sightings.push({
                                        pokemon : placemarks[p].ExtendedData[0].Data[0].value[0],
                                        lat : parseFloat(placemarks[p].Point[0].coordinates[0].split(',')[1]),
                                        lng : parseFloat(placemarks[p].Point[0].coordinates[0].split(',')[0]),
                                        country: "Brasil",
                                        state: "SC",
                                        city: "Joinville",
                                    });
                                }
                            }
                        }

                        insertSighting(0);
                    });
                });
            })
            .catch((err) => console.log("erro: ", err));
    });
