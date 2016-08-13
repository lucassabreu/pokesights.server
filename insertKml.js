var mongoose = require('mongoose');
var Sighting = require("./models/Sighting");
var xml2js = require('xml2js');
var fs = require('fs');

var parser = new xml2js.Parser();

var sightings = [];


mongoose.Promise = global.Promise;
mongoose.connect("mongodb://localhost/pokenests")
  .then(function() {
        
    fs.readFile(__dirname + '/mymap.kml', function(err, data) {
        parser.parseString(data, function (err, r) {

            var folders = r.kml.Document[0].Folder;
            for(var f in folders) {
                var placemarks = folders[f].Placemark;
                for(var p in placemarks) {
                    var sights = parseInt(placemarks[p].ExtendedData[0].Data[1].value[0]);
                    for(; sights > 0; sights--) {
                        sightings.push({
                            pokemon : placemarks[p].ExtendedData[0].Data[0].value[0],
                            lat : parseFloat(placemarks[p].Point[0].coordinates[0].split(',')[0]),
                            lng : parseFloat(placemarks[p].Point[0].coordinates[0].split(',')[1]),
                        });
                    }
                }
            }

            for(var s in sightings) {
                Sighting.addSighting(sightings[s], function(err, r) {
                    if (err) console.error(err)
                });
            }

            console.log(sightings);
            console.log('Done');
        });
    });
  })
  .catch((err) => console.error(err));
