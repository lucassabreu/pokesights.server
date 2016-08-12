'use strict';

var Nest = require("../models/Nest");
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

    Nest.addSight(sight, function (err, nest) {
        if (err) return next(err);
        res.json(nest)
    })
});

router.get ("/:id", function (req, res, next) {
    Nest.findById(req.params.id, function(err, nest) {
        if (err) return next(err);
        res.json(nest);
    });
});

router.put ("/:id/sight", function(req, res, next) {
    Nest.findById(req.params.id, function(err, nest) {
        if (err) return next(err);
        nest.sight();
        nest.save()
            .then (() => res.json(nest))
            .catch((err) => next(err));
    });
});

router.put ("/:id/unsight", function(req, res, next) {
    Nest.findById(req.params.id, function(err, nest) {
        if (err) return next(err);
        nest.unsight();
        nest.save()
            .then (() => res.json(nest))
            .catch((err) => next(err));
    });
});

router.get ("/:lat/:lng/:d", function (req, res, next) {

    var lat = parseFloat(req.params.lat);

    if (isNaN(lat)) {
        return next({
            status : 403,
            message : "Latitude must be a valid number !"
        });
    }

    var lng = parseFloat(req.params.lng);

    if (isNaN(lng)) {
        return next({
            status : 403,
            message : "longitude must be a valid number !"
        });
    }

    var distance = parseFloat(req.params.d);

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

    Nest.findByParams ({
        lat : lat,
        lng : lng,
        distance : distance,
        pokemons : pokemons,
        rarity : rarity
    }).then(function(nests) {
        res.json(nests);
    }).catch((err) => next(err));

});

module.exports = router;