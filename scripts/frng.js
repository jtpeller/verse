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

        // return that word
        return this.original[idx];
    }
}