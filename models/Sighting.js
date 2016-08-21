'use strict';

var mongoose = require('mongoose');
var PokemonInfo = require("./PokemonInfo");
var logger = require("../logger");
const util = require('util');
var ReadWriteLock = require('rwlock');
var ModelError = require("./ModelError");

var lock = new ReadWriteLock();

var SightingSchema = mongoose.Schema ({
    pokemon : String,
    rarity : Number,
    loc: {
        type: { type : String, default : "Point" },
        coordinates : [],
        city : {
            name : String,
            state : String,
            country : String,
        }
    },
    timesSighted : Number,
    timesUnsighted : Number,
    lastTimeSight : Date,
    lastTimeUnsight : Date,
    history : [
        {
            when : Date, 
            seen : Boolean 
        }
    ]
});

SightingSchema.index({ loc : '2dsphere' });

SightingSchema.methods.getConfiabilty = function () {
    if (this.history == null)
        return 0;

    var pro = 0, con = 0;
    var today = new Date();
    var validHis = this.history.filter(function (h) {
        return Math.round((today - v.when) / (1000 * 60 * 60 * 24)) <= 30;
    });
    for(var key in validHis) {
        if (validHis[key].seen)
            pro++;
        else
            con++;
    }

    return pro / (con + pro);
};

SightingSchema.methods.sight = function () {
    var self = this;
    return new Promise(function (fullfill, reject) {
        logger.debug(util.format("locking for 'update sighting %s'", (self._id ? self._id : "")));
        lock.writeLock(
            util.format("update sighting %s", (self._id ? self._id : "")),
            function (release) {
                self.timesSighted = !self.timesSighted ? 1 : self.timesSighted + 1;
                self.lastTimeSight = new Date();
                self.history.push({
                    when : self.lastTimeSight,
                    seen : true,
                });
                logger.debug(
                    util.format(
                        "Sigthing %s confirmmed for pokemon %s - %s", 
                        self._id,
                        self.pokemon,
                        PokemonInfo.Pokemons[self.pokemon].name 
                    )
                );
                self.save()
                    .then(function(sighting) {
                        release();
                        fullfill(sighting);
                    })
                    .catch(function(err) {
                        release();
                        reject(err);
                    });
            }
        );
    });
};

SightingSchema.methods.unsight = function () {
    var self = this;
    return new Promise(function (fullfill, reject) {
        logger.debug(util.format("locking for 'update sighting %s'", (self._id ? self._id : "")));
        lock.writeLock(
            "update sighting " + (self._id ? self._id : ""),
            function (release) {
                self.timesUnsighted = !self.timesUnsighted ? 1 : self.timesUnsighted + 1;
                self.lastTimeUnsight = new Date();
                self.history.push({
                    when : self.lastTimeUnsight,
                    seen : false,
                });
                logger.debug(
                    util.format(
                        "Sigthing %s not confirmmed for pokemon %s - %s", 
                        self._id,
                        self.pokemon,
                        PokemonInfo.Pokemons[self.pokemon].name 
                    )
                );
                self.save()
                    .then(function(sighting) {
                        release();
                        fullfill(sighting);
                    })
                    .catch(function(err) {
                        release();
                        reject(err);
                    });
            }
        );
    });
};

var Sighting = mongoose.model('sights', SightingSchema);

Sighting.MERGE_DISTANCE = 250; // meters

Sighting.addSighting = function (sight) {

    return new Promise(function (fullfill, reject) {

        sight.pokemon = sight.pokemon ? PokemonInfo.formatPokeNumber(sight.pokemon) : "000";

        if (!PokemonInfo.Pokemons[sight.pokemon]) {
            reject(new ModelError(util.format("Pokemon with number: '%s' does not exist !", sight.pokemon)));
            return;
        }

        sight.lat = sight.lat ? parseFloat(sight.lat) : null;
        if (sight.lat === null || isNaN(sight.lat) || sight.lat < -90 || sight.lat > 90) {
            reject(new ModelError("Latitude (lat) must be a valid number between -90 and 90 !"));
            return;
        }

        sight.lng = sight.lng ? parseFloat(sight.lng) : null;
        if (sight.lng === null || isNaN(sight.lng) || sight.lng < -180 || sight.lng > 180) {
            reject(new ModelError("Longitude (lng) must be a valid number between -180 and 180 !"));
            return;
        }

        if (!sight.country || sight.country === null) {
            reject(new ModelError("Country must be informmed !"));
            return;
        }

        if (!sight.state || sight.state === null) {
            reject(new ModelError("State must be informmed !"));
            return;
        }

        if (!sight.city || sight.state === null) {
            reject(new ModelError("City must be informmed !"));
            return;
        }

        logger.debug("locking for 'add sighting'");
        lock.writeLock('add sighting', function (release) {
            Sighting.findOneSightingCloserTo ({
                coords : sight,
                distance : Sighting.MERGE_DISTANCE,
                pokemons : sight.pokemon,
            })
                .then(function (sighting) {
                    if (sighting === null) {
                        var pi = PokemonInfo.Pokemons[sight.pokemon];
                        logger.debug(
                            util.format(
                                "Sighting inserted for Pokemon %s - %s, rarity level: %s - %s", 
                                sight.pokemon, 
                                pi.name,
                                pi.rarity.level,
                                pi.rarity.description)
                        );

                        sighting = new Sighting({
                            pokemon : sight.pokemon,
                            rarity : pi.rarity.level,
                            loc : {
                                coordinates : [ sight.lng, sight.lat ],
                                city : {
                                    name : sight.city,
                                    state : sight.state,
                                    country : sight.country
                                }
                            }
                        });
                    }

                    sighting.sight()
                        .then(function(sighting){
                            release();
                            fullfill(sighting)
                        })
                        .catch(function(err){
                            release();
                            reject(err)
                        });
                })
                .catch(function(err){
                    release();
                    reject(err)
                });
        });
    });
};

Sighting.getQueryInLocation = function (country, state, city, pokemons, rarity) {
    var query = {
        "loc.city.country" : country,
    };

    if (state) {
        query["loc.city.state"] = state;

        if (city)
            query["loc.city.name"] = city;
    }

    if (pokemons){
        if (pokemons instanceof Array) {
            if (pokemons.length > 0)
                query.pokemon = { $in : pokemons };
        } else 
            query.pokemon = pokemons;
    }

    if (rarity) {
        if (rarity instanceof Array)
            query.rarity = { $in : rarity };
        else
            query.rarity = { $gte : rarity };
    }

    return query;
};

Sighting.getQueryPokemonsCloser = function (coords, distance, pokemons, rarity) {
    var query = {
        loc : { 
            $near : {
                $geometry : {
                    type : "Point",
                    coordinates : [ coords.lng, coords.lat ]
                }, 
                $maxDistance : distance
            }
        }
    };

    if (pokemons){
        if (pokemons instanceof Array) {
            if (pokemons.length > 0)
                query.pokemon = { $in : pokemons };
        } else 
            query.pokemon = pokemons;
    }

    if (rarity) {
        if (rarity instanceof Array)
            query.rarity = { $in : rarity };
        else
            query.rarity = { $gte : rarity };
    }

    return query;
};

Sighting.findOneSightingCloserTo = function (params, callback) {
    return Sighting.findOne(
        Sighting.getQueryPokemonsCloser(
            params.coords, 
            params.distance, 
            params.pokemons, 
            params.rarity
        ), 
        params.fields, 
        callback);
};

Sighting.findSightingsCloserTo = function (params, callback) {
    return Sighting.find(
        Sighting.getQueryPokemonsCloser(
            params.coords, 
            params.distance, 
            params.pokemons, 
            params.rarity
        ), 
        params.fields, 
        callback);
};

Sighting.findOneInLocation = function (params, callback) {
    return Sighting.findOne (
        Sighting.getQueryInLocation (
            params.country,
            params.state,
            params.city, 
            params.pokemons, 
            params.rarity
        ),
        params.fields,
        callback
    )
};

Sighting.findInLocation = function (params, callback) {
    return Sighting.find (
        Sighting.getQueryInLocation (
            params.country,
            params.state,
            params.city, 
            params.pokemons, 
            params.rarity
        ),
        params.fields,
        callback
    )
};

module.exports = Sighting;