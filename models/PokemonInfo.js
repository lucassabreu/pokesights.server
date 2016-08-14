'use strict';

var fs = require('fs');

var PokemonInfo = function (number, name, family, rarity) {
    this.number = number;
    this.name = name;

    this.Pokemons[number] = this;

    if (!this.Families[family])
        this.Families[family] = {
            name : family,
            pokemons : [],
            pokemonNumbers : []
        };

    this.family = this.Families[family];
    this.family.pokemons.push(this);
    this.family.pokemonNumbers.push(this.number);

    this.rarity = this.Rarities[rarity];
    this.Rarities[rarity].pokemons.push(this);
    this.Rarities[rarity].pokemonNumbers.push(this.number);
}

PokemonInfo.Rarities = {};
PokemonInfo.Families = {};
PokemonInfo.Pokemons = {};

PokemonInfo.prototype = {
    number : 0,
    name : null,
    family : null,
    rarity : null,

    Rarities : PokemonInfo.Rarities,
    Families : PokemonInfo.Families,
    Pokemons : PokemonInfo.Pokemons,

    getFamilyMembers : function () {
        return this.family.pokemons;
    }
};

PokemonInfo.load = function (filename) {
    return new Promise(function(fullfill, reject) {
        fs.readFile(filename, function(err, data) {
            if (err) return reject(new Error(err));

            var data = JSON.parse(data);

            for(var i in data.rarity_description) {
                PokemonInfo.Rarities[i] = {
                    level : i,
                    description : data.rarity_description[i],
                    pokemons : [],
                    pokemonNumbers : []
                };
            }

            var p;
            for(i in data.pokemons)
                p = new PokemonInfo(i, data.pokemons[i].name, data.pokemons[i].family, data.pokemons[i].rarity);

            fullfill(PokemonInfo.Pokemons);
        });
    });
}

module.exports = PokemonInfo;