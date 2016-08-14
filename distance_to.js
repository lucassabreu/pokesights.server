require('dotenv').config({silent: true});
var mongoose = require('mongoose');
var Sighting = require("./models/Sighting");
var xml2js = require('xml2js');
var fs = require('fs');

var parser = new xml2js.Parser();

var sightings = [];

mongoose.Promise = global.Promise;
mongoose.connect(process.env.DSN_MONGO)
  .then(function() {

      var a = {                                                                                                                         
        "loc": {                                                                                                              
            "$near": {                                                                                                        
                "$geometry": {                                                                                                
                    "type": "Point",                                                                                          
                    "coordinates": [                                                                                          
                        -48.84849, -26.27075                                                                                             
                    ]                                                                                                         
                },                                                                                                            
                "$maxDistance": 1000                                                                                          
            }                                                                                                                 
        }                                                                                                                     
      };

      Sighting.aggregate (
          [ 
              { 
                  $geoNear : { 
                      near : { 
                          type : "Point", 
                          coordinates : [-48.84849, -26.27075] 
                    },
                    distanceField : "dist.calculated",
                    maxDistance : 1 * 1000, // 1 km
                    includeLocs : "dist.location",
                    num : 5,  
                    spherical : true   
                }
            },
            { 
                $project : { pokemon : true, dist : true } 
            }
        ]
      ).then(function(r) {
          console.log(JSON.stringify(r, null, 2));
      })
      .catch((err) => console.log(JSON.stringify(err, null, 2)));;

  });