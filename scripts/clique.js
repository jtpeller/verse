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

        // bot-specific logic attributes
        if (this.length == 5) {
            // use a precomputed list of words as a clique
            // Q is leftover
            this.clique = ["fjord", "gucks", "nymph", "vibex", "waltz"];
        }

        // If game length < 5, clique can't hit enough letters
        else if (this.length < 5) {
            // clique will work similar to eliminator, and figure out how to eliminate as many as possible

        }

        // if game length > 5, making a clique is a lot easier
        else if (this.length > 5) {

        }

        // getting here is a problem.
        else {
            throw new Error("Length is broken! This makes me sad. --> :(");
        }
    }

    precalculate() {
        return;     // do nothing.
    }

    selectGuess() {
        // if we're on our last guess
        if (this.nGuesses == this.maxGuesses - 1) {
            // utilize the updated word list with all clues to determine what to do.
        } else {
            // extract the value from the clique & return
            guess = this.clique[this.nGuesses];
            this.addGuess(guess)
            return guess;
        }
    }

    update() {
        // 
    }
}