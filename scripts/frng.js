// =================================================================
// = frng.js
// =  Description   : Implements Bot Logic for the Full RNG style
// =  Author        : jtpeller
// =  Date          : 2023.12.31
// =================================================================
'use strict';

class FRNG extends Bot {
    constructor(props) {
        super(props);
    }

    selectGuess() {
        // RNG an index
        let idx = this.rng(this.original.length);
        let guess = this.original[idx];

        if (this.DEBUG) {
            console.log("Index", idx, "word", guess)
        }

        // return that word
        this.addGuess(guess)
        return guess;
    }
}