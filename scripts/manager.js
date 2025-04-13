// =================================================================
// = manager.js
// =  Description   : Implements Bot manager
// =  Author        : jtpeller
// =  Date          : 2025.01.05
// =================================================================
'use strict';

/**
 * Manages the bots running, so each bot can just contain logic.
 * @param {Object} props        Contains game-related properties:
 * @param {Number} mode             > which bot to pick. 0 = FRNG, 1 = PRNG, 2 = ELIM, 3 = CLIQ
 * @param {Number} maxGuesses       > Maximum number of guesses
 * @param {Rate} rate               > Rate class, for rating guesses
 * @param {boolean} DEBUG           > used for output debugging.
 * @param {Object} botprops     Contains props destined for the bot.
 * @param {String[]} wordList       > word list (all same length)
 * @param {int} wordCount           > wordList array length
 * @param {int} length              > word length
 * @param {int} maxGuesses          > maximum number of guesses
 * @param {boolean} DEBUG           > used for output debugging.
 */
class Manager {
    // Bot mode "enum"
    MODE = Object.freeze({
        FRNG: 0,        // full RNG (random guessing from initial list)
        PRNG: 1,        // partial RNG (random guessing from updated list)
        ELIM: 2,        // eliminator bot
        CLIQ: 3,        // clique bot
        /* add new bots here, also add to switch later */
    });

    constructor(props, botprops) {
        // save the game properties
        this.mode = props.mode;
        this.maxGuesses = props.maxGuesses;
        this.rate = props.rate;
        this.DEBUG = props.DEBUG;

        Utils.log(props, "Manager Props:")
        Utils.log(botprops, "Manager Bot Props:")

        // save bot properties
        this.botprops = botprops;

        // manager attributes
        this.ratings = [];          // holds ratings for the bot's guesses

        // create the bot.
        this.initBot(this.mode);    // init the specified bot

        // play the game
        this.PlayGame();            // command bot to play game.
    }

    /**
     * Manager creates a bot based on specified mode.
     */
    initBot(mode) {
        switch (mode) {
            case this.MODE.PRNG:
                this.bot = new PRNG(this.botprops);
                break;
            case this.MODE.ELIM:
                this.bot = new Eliminator(this.botprops);
                break;
            case this.MODE.CLIQ:
                this.bot = new Clique(this.botprops);
                break;
            default:
                this.bot = new FRNG(this.botprops);
                break;
        }
    }

    /**
     * PlayGame() -- starting point for the bot.
     */
    PlayGame() {
        /** 
         * the general process of any bot is:
         * 1) perform pre-calculations
         * 2) select a word based on pre-calculations
         * 3) get the rating from the word
         * 4) check if correct. if so, bot's job is done.
         * 5) if not correct, perform updates
         * 6) go back to 1, until either maxGuesses is reached or the guess is correct.
         */
        for (let i = 0; i < this.maxGuesses; i++) {
            // step 1: precalculate
            this.bot.precalculate();

            // step 2: select word
            var guess = this.bot.selectGuess();
            if (this.DEBUG) {
                console.log("Guess: " + guess);
            }

            // step 3: get rating
            if (guess) {
                var rating = this.rate.rateGuess(guess);
                this.ratings.push(rating);
            } else {
                console.error("Guess is undefined!")
                console.log(this.bot.wordList);
            }

            // step 4: check if correct
            if (!rating.includes(0) && !rating.includes(1)) {
                // guess is correct! we can exit the loop
                this.bot.correct = true;
                break;
            }

            // step 5: update
            // getting here means bot is incorrect. update word list
            this.bot.update(guess, rating);
        }

        // now, there are two possibilities: bot was correct, or bot exhausted guesses.
        // either way, game is over
        return;
    }

    getGuessCount() {
        return this.bot.getGuessCount();
    }

    reset(new_list = null, run_again = true) {
        // reset bot-specific values
        this.ratings = [];

        // reset bot
        if (new_list) {
            this.bot.setWordList(new_list);
        } else {
            this.bot.reset();
        }

        // then, Play a new game
        if (run_again) {
            this.PlayGame();
        }
    }
}