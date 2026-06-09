function attack(attacker, defender, move) {

    console.log(`\n${attacker.name} utilise ${move.name}`);
    if (move.pp <= 0) {
        console.log("Plus de PP !");
        return;
    }
    const chance = Math.floor(Math.random() * 100) + 1;

    if (chance > move.accuracy) {
        console.log("Attaque ratée !");
        return;
    }

    const enemyPP = defender.moves.reduce((sum, m) => sum + m.pp, 0);

    

    defender.hp -= move.power;
    move.pp--;

    console.log(` ${defender.name} perd ${move.power} HP`);
}

module.exports = { attack };