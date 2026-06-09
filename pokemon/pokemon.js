class Pokemon {
    constructor(name, moves) {
        this.name = name;
        this.hp = 300;
        this.moves = moves;
    }

    isAlive() {
        return this.hp > 0;
    }
}

module.exports = Pokemon;