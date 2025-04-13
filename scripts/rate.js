// =================================================================
// = rate.js
// =  Description   : Implements rating functionality in a static class
// =  Author        : jtpeller
// =  Date          : 2025.01.16
// =================================================================
'use strict';

class Rate {
    // private field word
    #word;
    #uuid;

    constructor(word, uuid) {
        this.#word = word;
        this.#uuid = uuid;
        this.wordLength = word ? word.length : 0;
    }

    /**
     * rateGuess() - compute the results of the guess
     * @param {string} guess 
     * 
     * @returns {Number[]}      guess rating. 0 = incorrect, 1 = present, 2 = correct
     */
    rateGuess(guess) {
        // check the result of the guess compared to the word.
        let wordCopy = this.#word;
        let rating = Array(this.wordLength).fill(0);
        var temp = guess.toUpperCase();

        // loop thru the word, checking for identicals
        for (let i = 0; i < this.wordLength; i++) {
            let letter = temp[i];

            if (this.#word[i] === letter) {
                // set the rating
                rating[i] = 2;

                // any letter marked as correct should be removed from the wordcopy
                wordCopy = wordCopy.replace(letter, ' ');
            }
        }

        // now, check remaining letters to see if they exist in the word
        for (let i = 0; i < this.wordLength; i++) {
            let letter = temp[i];

            if (this.#word.includes(letter) && wordCopy.includes(letter)) {
                // set the rating, but only if the cell is not already set
                if (rating[i] === 0) {
                    rating[i] = 1;
                }

                // now that it has been marked as incorrect, remove instance from wordcopy
                wordCopy = wordCopy.replace(letter, ' ');
            }
            // if the latter is not true, then the word does not contain the letter and it is marked wrong
            // no action is necessary because rating is already filled with 0s.
        }

        return rating;
    }

    setWord(word, uuid) {
        if (this.#uuid == uuid) {
            this.#word = word;
            this.wordLength = word.length;
        } else {
            console.error("Unauthorized word change!")
        }
    }
}