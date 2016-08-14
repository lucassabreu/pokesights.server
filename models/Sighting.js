'use strict';

var mongoose = require('mongoose');
var PokemonInfo = require("./PokemonInfo");

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

SightingSchema.methods.sight = function () {
    this.timesSighted = !this.timesSighted ? 1 : this.timesSighted + 1;
    this.lastTimeSight = new Date();
    this.history.push({
        when : this.lastTimeSight,
        seen : true,
    }); 
};

SightingSchema.methods.unsight = function () {
    this.timesUnsighted = !this.timesUnsighted ? 1 : this.timesUnsighted + 1;
    this.lastTimeUnsight = new Date();
    this.history.push({
        when : this.lastTimeUnsight,
        seen : false,
    }); 
};

var Sighting = mongoose.model('sights', SightingSchema);

Sighting.MERGE_DISTANCE = 250; // meters

Sighting.addSighting = function (sight, callback) {

    if (!PokemonInfo.Pokemons[sight.pokemon]) {
        callback(new Error("Pokemon with number: '" + sight.pokemon + "' does not exist !"), null);
        return;
    }

    Sighting.findOneSightingCloserTo ({
        coords : sight,
        distance : Sighting.MERGE_DISTANCE,
        pokemons : sight.pokemon,
    })
        .then(function (sighting) {
            if (sighting === null) {
                var pi = PokemonInfo.Pokemons[sight.pokemon];
                console.log(
                    "Inserting Sight for Pokemon", sight.pokemon, "-",
                    pi.name + ", rarity level:", 
                    pi.rarity.level, "-",
                    pi.rarity.description
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

            sighting.sight();
            sighting.save()
                .then(() => callback(null, sighting) )
                .catch(function(err) {
                    callback(err, sighting)
                });
        })
        .catch(function(err) {
            callback(err, [])
        });
};

Sighting.getQueryInLocation = function (country, state, city, pokemons, rarity) {
    var query = {
        country : country,
    };

    if (state) {
        query.state = state;

        if (city)
            query.city = city;
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
            params.contry,
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
            params.contry,
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