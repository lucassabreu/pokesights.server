'use strict';

var Sighting = require("../models/Sighting");
var express = require('express');
var multer = require('multer');
var router = express.Router();
var upload = multer(); // for parsing multipart/form-data
var PokemonInfo = require("../models/PokemonInfo");

var Utils = require('../utils');

router.post ("/", upload.array(), function(req, res, next) {
    var pokemon = !req.body.pokemon ? 0 : parseInt(req.body.pokemon);

    if (isNaN(pokemon) || pokemon < 1 || pokemon > 150) {
        return next({
            status : 403,
            message : "Pokemon number must be between 001 and 150 !",
        }); 
    }

    pokemon = Utils.formatPokeNumber(pokemon);

    var lat = !req.body.lat ? null : parseFloat(req.body.lat);

    if (lat === null || isNaN(lat)) {
        return next({
            status : 403,
            message : "Latitude (lat) must be a valid number !"
        });
    }

    var lng = !req.body.lng ? null : parseFloat(req.body.lng);

    if (lng === null || isNaN(lng)) {
        return next({
            status : 403,
            message : "Longitude (lng) must be a valid number !"
        });
    }

    var sight = {
         pokemon : pokemon, 
         lat : lat, 
         lng : lng
    };

    Sighting.addSighting(sight, function (err, sighting) {
        if (err) return next(err);
        res.json(sighting)
    })
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

        sighting.sight();
        sighting.save()
            .then (function() {
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

        sighting.unsight();
        sighting.save()
            .then (function() {
                sighting.history = undefined;
                res.json(sighting)
            })
            .catch((err) => next(err));
    });
});

router.get ("/", function (req, res, next) {

    var lat = parseFloat(req.query.lat);

    if (isNaN(lat)) {
        return next({
            status : 403,
            message : "Latitude must be a valid number !"
        });
    }

    var lng = parseFloat(req.query.lng);

    if (isNaN(lng)) {
        return next({
            status : 403,
            message : "longitude must be a valid number !"
        });
    }

    var distance = parseFloat(req.query.d);

    if (isNaN(distance)) {
        return next({
            status : 403,
            message : "Distance must be a valid number in kilometers !"
        });
    }

    var pokemons = req.query.pokemons ? req.query.pokemons.split(',') : [];

    for(var i in pokemons) {
        var n = parseInt(pokemons[i]);
        if (isNaN(n) || n < 1 || n > 150) {
            return next({
                status : 403,
                message : "'pokemons' parameter must have only numbers between 001 and 150"
            });
        }

        pokemons[i] = Utils.formatPokeNumber(n);
    }

    var rarity = req.query.rarity ? parseInt(req.query.rarity) : 0;
    
    if (isNaN(rarity) || rarity < 0 || rarity > 7) {
        return next({
            status : 403,
            message : "'rarity' parameter must be a number between 0 and 7"
        });
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
        // fields : { history : false } // do not show history
    }).then(function(sightings) {
        res.json(sightings);
    }).catch((err) => next(err));

});

module.exports = router;