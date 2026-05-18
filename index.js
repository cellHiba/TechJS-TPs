const readline = require("readline-sync");
const { getPokemon, getMoves } = require("./api");
const Pokemon = require("./pokemon");
const { attack } = require("./battle");
async function randomPokemon() {
    const id = Math.floor(Math.random() * 151) + 1;
    const data = await getPokemon(id);
    const moves = await getMoves(data);
    return new Pokemon(data.name, moves);
}

async function game() {

    const name = readline.question("Choisissez votre Pokemon: ");

    const data = await getPokemon(name);
    const playerMoves = await getMoves(data);
    const player = new Pokemon(data.name, playerMoves);

    const bot = await randomPokemon();

    console.log(`\n Player: ${player.name}`);
    console.log(` Bot: ${bot.name}`);

    while (player.isAlive() && bot.isAlive()) {

        console.log(`\n HP ${player.name}: ${player.hp} | ${bot.name}: ${bot.hp}`);

        
        console.log("\nChoisissez une attaque:");

        player.moves.forEach((m, i) => {
            console.log(`${i + 1}. ${m.name} (P:${m.power}, A:${m.accuracy}, PP:${m.pp})`);
        });

        const choice = readline.questionInt("Votre choix: ") - 1;
        const move = player.moves[choice];

        attack(player, bot, move);

       
        if (bot.isAlive()) {
            const botMove = bot.moves[Math.floor(Math.random() * 5)];
            attack(bot, player, botMove);
        }
    }

    
    if (player.isAlive()) {
        console.log("\n Vous avez gagné !");
    } else {
        console.log("\nVous avez perdu !");
    }
}

game();