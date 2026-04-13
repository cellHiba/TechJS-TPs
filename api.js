const axios = require("axios");
async function getPokemon(name) {
    const res = await axios.get(`https://pokeapi.co/api/v2/pokemon/${name}`);
    return res.data;
}
async function getMoves(pokemon) {
    const moves = pokemon.moves
        .sort(() => 0.5 - Math.random())
        .slice(0, 5);

    const result = [];

    for (let m of moves) {
        const res = await axios.get(m.move.url);
        const data = res.data;

        result.push({
            name: data.name,
            power: data.power || 50,
            accuracy: data.accuracy || 100,
            pp: data.pp || 10
        });
    }

    return result;
}

module.exports = { getPokemon, getMoves };