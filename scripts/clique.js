// =================================================================
// = clique.js
// =  Description   : Implements Bot Logic for the Clique style.
// =  Author        : jtpeller
// =  Date          : 2025.01.08
// =================================================================
'use strict';

class Clique extends Bot {
    constructor(props) {
        super(props);

        switch (this.length) {
            case 3:
                // technically not possible
                this.clique = [];
            case 4:
                this.clique = [];
            case 5:
                // use a precomputed list of words as a clique set
                // Q is leftover
                this.clique = ["FJORD", "GUCKS", "NYMPH", "VIBEX", "WALTZ"];
                break;
            case 6:
                this.clique = ["ABDUCT", "ABHORS", "ABJECT", "KINGLY"];
                break;
            case 7:
                this.clique = ["FLOCKED", "JUMPING", "SWARTHY"];
                break;
            case 8:
                this.clique = ["ABDUCTOR", "FLESHING", "SHELVING"];
                break;
            case 9:
                this.clique = ["AFTERGLOW", "CHIPMUNKS"];
                break;
            case 10:
                this.clique = ["CHARMINGLY", "JUXTAPOSED"];
                break;
            case 11:
                // with the current word list, this word eliminates every other word
                this.clique = ["PRECAUTIONS"];
                break;
            case 12:
                // with the current word list, this word eliminates every other word
                this.clique = ["REPLICATIONS"];
                break;
            default:
                throw new Error("Length is broken! This makes me sad. --> :(");
        }
    }

    selectGuess() {
        // if we've already guessed the whole clique
        if (this.nGuesses == this.clique.length || this.clique.length == 0) {
            // utilize the updated word list with all clues to determine what to do.
            // RNG an index
            let idx = this.rng(this.wordCount);
            let guess = this.wordList[idx];

            if (this.DEBUG) {
                console.log("Index", idx, "word", guess)
            }

            // return that word
            this.addGuess(guess)
            return guess;
        } else {
            // extract the value from the clique & return
            let guess = this.clique[this.nGuesses];
            this.addGuess(guess)
            return guess;
        }
    }
}