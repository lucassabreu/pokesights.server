'use strict';

var Sighting = require("../models/Sighting");
var express = require('express');
var multer = require('multer');
var router = express.Router();
var upload = multer(); // for parsing multipart/form-data

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

    var lat = !req.body.latitude ? null : parseFloat(req.body.latitude);

    if (lat === null || isNaN(lat)) {
        return next({
            status : 403,
            message : "Latitude must be a valid number !"
        });
    }

    var lng = !req.body.longitude ? null : parseFloat(req.body.longitude);

    if (lng === null || isNaN(lng)) {
        return next({
            status : 403,
            message : "longitude must be a valid number !"
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
        res.json(sighting);
    });
});

router.put ("/:id/sight", function(req, res, next) {
    Sighting.findById(req.params.id, function(err, sighting) {
        if (err) return next(err);
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
            message : "Distance must be a valid integer in meters !"
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

        pokemons[i] = Utils.formatPokeNumer(n);
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
        distance : distance,
        pokemons : pokemons,
        rarity : rarity,
        fields : {
            _id : true,
            pokemon : true,
            loc : true,
        }
        // fields : { history : false } // do not show history
    }).then(function(sightings) {
        res.json(sightings);
    }).catch((err) => next(err));

});

module.exports = router;