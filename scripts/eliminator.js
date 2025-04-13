// =================================================================
// = eliminator.js
// =  Description   : Implements Bot Logic for the Eliminator style.
// =  Author        : jtpeller
// =  Date          : 2023.12.31
// =================================================================
'use strict';

class Eliminator extends Bot {
    constructor(props) {
        super(props);       // let parent do the work.

        // bot-specific logic fields
        this.FACTOR = 5;            // factor to weight flagged letters
    }

    /**
     * Eliminator computes:
     *  1. Count of unique letters in each word of the provided word list.
     *  2. Score of each word, where the score represents how many words it will eliminate.
     *      a. Only unique letters are counted! (FOO has same score as FO)
     * End result is:
     *  {Number[]} this.prob     | Index is a letter (A-Z)
     *  {Number[]} this.score    | Indexed by number, but aligns to the word list (same order).
     */
    precalculate() {
        // step 1: count
        this.#countUniqueLetters();
        super.log(this.prob, 'Letters:');

        // step 2: score words
        this.#scoreEachWord();
        super.log(this.wordList, 'Words:');
        super.log(this.scores, 'Scores:');
    }

    /**
     * Eliminator uses this.score to select the guess that eliminates the most words.
     * @returns {String} guess  | Bot's guess, String, selected from word list.
     */
    selectGuess() {
        // with the scores, find the maximum score and select that word
        let idxOfMaxScore = -1;
        let maxScore = -1;
        for (let i = 0; i < this.scores.length; i++) {
            if (maxScore < this.scores[i]) {
                maxScore = this.scores[i];
                idxOfMaxScore = i;
            }
        }

        /**
         * TODO: Bot needs to be able to recognize it is in a situation where
         *  the words left to guess are mutually exclusive (i.e., 1 guess doesn't
         *  eliminate enough words to widdle down the list enough before the bot
         *  would run out of guesses).
         * In other words, the bot should make a separate guess that doesn't use
         *  its determinations to eliminate the words it knows.
         * EX: SLAYS. Remaining guesses are BLABS, SLAMS, and SLAYS.
         *  Bot will only have 2 guesses remaining, and would normally guess BLABS and SLAMS.
         *  If playing in strict mode (i.e., must use all info available), bot should be made to
         *      RNG the final 2 guesses to improve its chances.
         *  If no strict mode, bot should stop, refer to original word list, 
         *      and make a guess to eliminate/reveal final letters.
         */

        var guess = this.wordList[idxOfMaxScore];
        this.addGuess(guess);
        return guess;
    }

    /**
     * reset() -- calls super, but also resets its own attributes
     */
    reset() {
        // call parent to reset bot functions
        super.reset();

        // reset class-specific attributes
        this.flagged = [];          // array of letters marked "present"
        this.FACTOR = 5;            // factor to weight flagged letters
    }

    // =================================================================
    // Private helper functions
    // =================================================================
    /**
     * using wordList, the bot calculates how many words the letter would eliminate
     */
    #countUniqueLetters() {
        // letters holds the count of each letter
        let letters = {};

        // loop through list
        for (let i = 0; i < this.wordCount; i++) {
            // use a Set to avoid skewing toward multi-occurrence letters
            // (e.g., SULLY has 2 L's but only count: S, U, L, Y)
            var word = Array.from(new Set(this.wordList[i]));
            var wordlen = word.length;

            // loop through the word
            for (var j = 0; j < wordlen; j++) {
                // extract letter
                var letter = word[j];

                // check range to ensure it is a letter.
                if (/^[A-Z]$/.test(letter) == false) {
                    continue;
                }

                // count the letter. if it hasn't been experienced yet, initialize with 1.
                if (letters[letter]) {
                    letters[letter]++;
                } else {
                    letters[letter] = 1;    // initial count
                }
            }
        }

        // afterward, make sure to weight flagged letters more heavily.
        //for (let i = 0; i < this.flagged.length; i++) {
        //    var flag = this.flagged[i];
        //    letters[flag] *= this.FACTOR;
        //}

        // empty flagged letters array
        this.flagged = [];

        // store it for later use by deep-copying the obj.
        this.prob = structuredClone(letters);
        return;
    }

    /**
     * rank each word in the word list
     */
    #scoreEachWord() {
        // scores holds the words ranked by how many words it would eliminate
        let scores = Array(this.wordCount).fill(0);

        // loop through the words and compute the scores
        for (let i = 0; i < this.wordCount; i++) {
            let word = this.wordList[i];
            scores[i] = this.#scoreWord(word);
        }

        // save this as an attribute
        this.scores = scores.slice();
        return;
    }

    // helper function to offload work of scoring a single word
    #scoreWord(word) {
        // only count unique letters to avoid doubling a letter's effect.
        let unique = Array.from(new Set(word));

        // score the provided word
        let score = 0;
        for (let j = 0; j < unique.length; j++) {
            score += this.#getLetterValue(unique[j]);
        }

        return score;
    }

    /**
     * getter function to retrieve the probability of a letter
     * (note: this has to access this.prob, leave as method)
     */
    #getLetterValue(letter) {
        // error checking
        if (!this.isAlpha(letter)) {
            return 1;       // no effect
        }
        return this.prob[letter];
    }
}
