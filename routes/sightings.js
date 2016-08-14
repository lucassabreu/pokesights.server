'use strict';

var express = require('express');
var multer = require('multer');
var router = express.Router();
var upload = multer(); // for parsing multipart/form-data

var logger = require("../logger");
var Sighting = require("../models/Sighting");
var PokemonInfo = require("../models/PokemonInfo");
var ModelError = require("../models/ModelError");

router.get ("/geo-code", function (req, res, next) {

    var lat = parseFloat(req.query.lat);

    if (isNaN(lat) || lat < -90 || lat > 90) {
        return next({
            status : 403,
            message : "Latitude must be a valid number between -90 and 90 !"
        });
    }

    var lng = parseFloat(req.query.lng);

    if (isNaN(lng) || lng < -180 || lng > 180) {
        return next({
            status : 403,
            message : "longitude must be a valid number between -180 and 180 !"
        });
    }

    var distance = parseFloat(req.query.d);

    if (isNaN(distance)) {
        return next({
            status : 403,
            message : "Distance must be a valid number in kilometers !"
        });
    }

    try {
        var pokemons = convertPokemonParam(req.query.pokemons);
        var rarity = convertRarityParam(req.query.rarity);
    } catch (error) {
        return next(error);    
    }

    Sighting.findSightingsCloserTo ({
        coords : {
            lat : lat,
            lng : lng,
        },
        distance : distance * 1000, // km to meters
        pokemons : pokemons,
        rarity : rarity,
        fields : {
            history : false,
        }
    }).then(function(sightings) {
        res.json(sightings);
    }).catch((err) => next(err));

});

router.get ("/loc-name", function (req, res, next) {

    var filter = {
        "country" : req.query.country,
        "state" : req.query.state,
        "city" : req.query.city,
    };

    try {
        var pokemons = convertPokemonParam(req.query.pokemons);
        var rarity = convertRarityParam(req.query.rarity);
    } catch (error) {
        return next(error);    
    }
    
    Sighting.findInLocation ({
        country : filter.country,
        state : filter.state,
        city : filter.city,
        pokemons : pokemons,
        rarity : rarity,
        fields : {
            history : false,
        }
    }).then(function(sightings) {
        res.json(sightings);
    }).catch((err) => next(err));

});

router.post ("/", upload.array(), function(req, res, next) {
    var pokemon = req.body.pokemon || 0;
    var lat = req.body.lat;
    var lng = req.body.lng;
    var country = req.body.country;
    var state = req.body.state;
    var city = req.body.city;

    var sight = {
         pokemon : pokemon, 
         lat : lat, 
         lng : lng,
         country : country,
         state : state,
         city : city
    };

    Sighting.addSighting(sight)
        .then(function(sighting) {
            sighting.history = undefined;
            res.json(sighting)
        })
        .catch((err) => next(err));
});

router.get ("/:id", function (req, res, next) {
    Sighting.findById(req.params.id, function(err, sighting) {
        if (err) return next(err);

        if (sighting === null)
            return next({
                status : 404,
                message : "This sighting does not exist !"
            });

        res.json(sighting);
    });
});

router.put ("/:id/sight", function(req, res, next) {
    Sighting.findById(req.params.id, function(err, sighting) {
        if (err) return next(err);

        if (sighting === null)
            return next({
                status : 404,
                message : "This sighting does not exist !"
            });

        sighting.sight()
            .then (function(sighting) {
                sighting.history = undefined;
                res.json(sighting)
            })
            .catch((err) => next(err));
    });
});

router.put ("/:id/unsight", function(req, res, next) {
    Sighting.findById(req.params.id, function(err, sighting) {
        if (err) return next(err);

        if (sighting === null)
            return next({
                status : 404,
                message : "This sighting does not exist !"
            });

        sighting.unsight()
            .then (function(sighting) {
                sighting.history = undefined;
                res.json(sighting)
            })
            .catch((err) => next(err));
    });
});

function convertPokemonParam (pokemons) {
    pokemons = pokemons ? pokemons.split(',') : [];

    for(var i in pokemons) {
        var n = parseInt(pokemons[i]);
        if (isNaN(n) || n < 1 || n > 150) {
            throw {
                status : 403,
                message : "'pokemons' parameter must have only numbers between 001 and 150"
            };
        }

        pokemons[i] = PokemonInfo.formatPokeNumber(n);
    }

    return pokemons;
}

function convertRarityParam (rarity) {
    rarity = rarity ? parseInt(rarity) : 0;
    
    if (isNaN(rarity) || rarity < 0 || rarity > 7) {
        throw {
            status : 403,
            message : "'rarity' parameter must be a number between 0 and 7"
        };
    }

    return rarity;
}

function formatError(err) {
    if (err instanceof ModelError)
        return {
            status : 403,
            message : err.message,
            stack : err.stack
        };
    else {
        if (err instanceof Error) {
            return {
                message : err.message,
                stack : err.stack
            };
        } else {
            return {
                message : err.message,
            };
        }
    }
}

module.exports = router;