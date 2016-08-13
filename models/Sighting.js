'use strict';

var mongoose = require('mongoose');

var SightingSchema = mongoose.Schema ({
    pokemon : String,
    loc: {
        type: { type: String, default : "Point"},
        coordinates: [],
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

    Sighting.findOneSightingCloserTo ({
        coords : sight,
        distance : Sighting.MERGE_DISTANCE,
        pokemons : sight.pokemon,
    })
        .then(function (sighting) {
            if (sighting === null) {
                sighting = new Sighting({
                    pokemon : sight.pokemon,
                    loc : {
                        coordinates : [ sight.lng, sight.lat ]
                    }
                });
            }

            sighting.sight();
            sighting.save()
                .then(() => callback(null, sighting) )
                .catch((err) => callback(err, sighting) );
        })
        .catch((err) => callback(err, []));
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
        if (pokemons instanceof Array)
            query.pokemon = { $in : pokemons };
        else 
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
        if (pokemons instanceof Array)
            query.pokemon = { $in : pokemons };
        else 
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