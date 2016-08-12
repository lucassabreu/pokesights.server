'use strict';

var mongoose = require('mongoose');

var NestSchema = mongoose.Schema ({
    pokemon : String,
    loc: {
      type: {type: String},
      coordinates: []
    },
    times_sighted : Number,
    times_unsighted : Number,
    last_time_sight : Date,
    last_time_unsight : Date,
    history : [
        {
            when : Date, 
            seen : Boolean 
        }
    ]
});
NestSchema.index({ loc : '2dsphere' });

NestSchema.methods.sight = function () {
    this.times_sighted = !this.times_sighted ? 1 : this.times_sighted + 1;
    this.last_time_sight = new Date();
    this.history.push({
        when : this.last_time_sight,
        seen : true,
    }); 
};

NestSchema.methods.unsight = function () {
    this.times_unsighted = !this.times_unsighted ? 1 : this.times_unsighted + 1;
    this.last_time_unsight = new Date();
    this.history.push({
        when : this.last_time_unsight,
        seen : false,
    }); 
};

var Nest = mongoose.model('nests', NestSchema);

Nest.MERGE_DISTANCE = 50; // meters

Nest.addSight = function (sight, callback) {

    Nest.find({
        pokemon : sight.pokemon,
        loc : { 
            $near : {
                $geometry : {
                    type : "Point",
                    coordinates : [ sight.lng, sight.lat ]
                }, 
                $maxDistance : Nest.MERGE_DISTANCE 
            }
        }
    }, function (err, nests) {
        if (err)
            return callback(err, []);

        var nest = null;
        if (nests.length !== 0) {
            nest = nests[0];
        } else {
            nest = new Nest({
                pokemon : sight.pokemon,
                loc : {
                    type: "Point",
                    coordinates : [ sight.lng, sight.lat ]
                }
            });
        }

        nest.sight();
        nest.save()
            .then(() => callback(null, nest) )
            .catch((err) => callback(err, nest) );
    });

}

module.exports = Nest;