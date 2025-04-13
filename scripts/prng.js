// =================================================================
// = prng.js
// =  Description   : Implements Bot Logic for the Partial RNG style
// =  Author        : jtpeller
// =  Date          : 2023.12.31
// =================================================================
'use strict';

class PRNG extends Bot {
    constructor(props) {
        super(props);
    }

    selectGuess() {
        // RNG an index
        let idx = this.rng(this.wordCount);
        let guess = this.wordList[idx];

        if (this.DEBUG) {
            console.log("Index", idx, "word", guess)
        }

        // return that word
        this.addGuess(guess)
        return guess;
    }
}