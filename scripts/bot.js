// =================================================================
// = bot.js
// =  Description   : Implements Parent Class: Bot
// =  Author        : jtpeller
// =  Date          : 2023.12.31
// =================================================================
'use strict';

class Bot {
    /**
     * Parent class for a bot. Functionality defined in child class.
     * @param {Object} props            | contains these fields:
     * @param {String[]} wordList       | word list (all same length)
     * @param {int} wordCount           | wordList array length
     * @param {int} length              | word length
     * @param {int} maxGuesses          | maximum number of guesses
     * @param {boolean} DEBUG           | used for output debugging.
     */
    constructor(props) {
        // extract class properties
        this.wordList = props.wordList;
        this.original = structuredClone(props.wordList);
        this.wordCount = props.wordList.length;
        this.length = props.length;
        this.maxGuesses = props.guesses;
        this.DEBUG = props.DEBUG | false;

        // create now, use later
        this.nGuesses = 0;      // number of guesses made    
        this.prob = [];         // letter counts
        this.scores = [];       // score based on how many words will be eliminated
        this.guesses = [];      // array of guesses. Array<String>
        this.correct = false;   // whether the correct word has been found
        
        this.regex = Array(this.length).fill(`[ABCDEFGHIJKLMNOPQRSTUVWXYZ]+`);
        this.flagged = [];      // array of letters marked "present"
    }

    /** precalculate is intended to be overridden by subclasses */
    precalculate() {
        return;
    }

    addGuess(guess) {
        this.guesses.push(guess);   // add to guesses array
        this.nGuesses++;            // increment count.
    }

    // check if word contains only A-Z.
    isAlpha(word) {
        return /^[A-Z]+$/.test(word);
    }

    // log value
    #log(value, name="") {
        if (this.DEBUG) {
            console.log(name, JSON.parse(JSON.stringify(value)));
        }
    }

    /**
     * reset() -- sets the bot back to initial state
     */
    reset() {
        // ensure word list is a clean copy.
        this.wordList = structuredClone(this.original);
        if (this.DEBUG) {
            this.#log(this.wordList, "Word List:");
            this.#log(this.original, "Original:");
        }
        
        // reset wordCount and word length from original list.
        this.wordCount = this.wordList.length;
        this.length = this.wordList[0].length;
        this.flagged = [];          // array of letters marked "present"

        // reset bot state variables
        this.nGuesses = 0;      // number of guesses made    
        this.prob = [];         // letter counts
        this.scores = [];       // score based on how many words will be eliminated
        this.guesses = [];      // array of guesses. Array<String>
        this.correct = false;   // whether the correct word has been found

        // other parameters need not change upon reset.
        this.regex = Array(this.length).fill(`[ABCDEFGHIJKLMNOPQRSTUVWXYZ]+`);
    }

    /**
     * setWordList() -- as needed, tell bot there's a new list
     */
    setWordList(new_list) {
        // save list
        this.original = structuredClone(new_list);

        // reset bot
        this.reset();
    }

    /**
     * updateRegex() - computes/updates the regex
     */
    updateRegex(guess, rating) {
        var correct = Array(this.length).fill(false);

        // loop through and check all correct letters
        for (let i = 0; i < this.length; i++) {
            // first, check all corrects
            let letter = guess[i];
            if (rating[i] == 2) {
                // means letter is correct. replace with just this letter
                this.regex[i] = letter;
                correct[i] = true;
            }
        }

        // loop through and check all present (i.e., rating=1) letters
        let checked = '';
        for (let i = 0; i < this.length; i++) {
            let letter = guess[i];
            if (rating[i] == 1) {
                // means letter exists, but in wrong spot, remove letter from this spot
                this.regex[i] = this.regex[i].replace(letter, '');
                checked += letter;      // ensure the "absent" loop doesn't remove this anywhere else
            }
        }

        // loop through and check absent (i.e., rating = 0) letters
        for (let i = 0; i < this.length; i++) {
            let letter = guess[i];

            // process rating value
            if (rating[i] == 0) {
                // means no match.
                // if the letter has been marked as present elsewhere, only delete from this spot
                if (checked.includes(letter)) {
                    this.regex[i] = this.regex[i].replace(letter, '');
                } else {
                    // remove from each expression
                    for (let j = 0; j < this.length; j++) {
                        if (!correct[j]) {      // do not remove from correct spot
                            this.regex[j] = this.regex[j].replace(letter, '');
                        }
                    }
                }
            }
        }

        if (this.DEBUG) {
            this.#log(this.regex, "Regex:");
        }
    }

    /**
     * Using the rating (and guess), Eliminator updates possibilities (regex + word list).
     */
    update(guess, rating) {
        // if the rating has no 0s or 1s, rating is 100% correct
        if (!rating.includes(0) && !rating.includes(1)) {
            this.wordList = [guess];
            return;
        }

        // update regex
        this.updateRegex(guess, rating);

        // update flagged letters
        for (let i = 0; i < rating.length; i++) {
            // flag any letter where rating is 1 ("present").
            if (rating[i] == 1) {
                this.flagged.push(guess[i]);
            }
        }
        this.#log(this.flagged, "Flagged:");

        // word will match this combined expression:
        var r = '';
        for (let i = 0; i < this.regex.length; i++) {
            r += this.regex[i];     // combine the strings together.
        }
        let exp = new RegExp(r);

        // loop through wordlist and check for matches
        var temp = [];
        for (let i = 0; i < this.wordList.length; i++) {
            var word = this.wordList[i];

            // test the word
            if (exp.test(word)) {
                // word matches!
                temp.push(word);
            }
        }

        this.wordList = structuredClone(temp);
        this.wordCount = this.wordList.length;
    }

    /**
     * rng() generates a random number between 0 and max.
     * @param {Number} max      what to select (e.g., an id: "#element-id" or a class ".element-class")
     * 
     * @returns {Number}        randomly generated value in [0, max)
     */
    rng(max) {
        return Math.floor(Math.random() * max);
    }
}
