'use strict';

var fs = require('fs');

var PokemonInfo = function (number, name, family, rarity) {
    this.number = PokemonInfo.formatPokeNumber(number);
    this.name = name;

    PokemonInfo.Pokemons[this.number] = this;

    if (!PokemonInfo.Families[family])
        PokemonInfo.Families[family] = {
            name : family,
            pokemons : [],
            pokemonNumbers : []
        };

    this.family = PokemonInfo.Families[family];
    this.family.pokemons.push(this);
    this.family.pokemonNumbers.push(this.number);

    this.rarity = PokemonInfo.Rarities[rarity];
    this.rarity.pokemons.push(this);
    this.rarity.pokemonNumbers.push(this.number);
}

PokemonInfo.Rarities = {};
PokemonInfo.Families = {};
PokemonInfo.Pokemons = {};

PokemonInfo.prototype = {
    number : 0,
    name : null,
    family : null,
    rarity : null,

    getFamilyMembers : function () {
        return this.family.pokemons;
    }
};

PokemonInfo.load = function (filename) {

    filename = filename || (process.cwd() + "/resources/pokemon_info.json");

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

PokemonInfo.formatPokeNumber = function(num) {
    num = parseInt(num);

    if (num < 10)
        return "00" + num.toString();
    else {
        if (num < 100)
            return "0" + num.toString();
        else
            return num.toString();
    }
};

module.exports = PokemonInfo;