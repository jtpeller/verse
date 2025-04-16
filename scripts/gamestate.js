// =================================================================
// = GameState.js
// =  Description   : Implements GameState class
// =  Author        : jtpeller
// =  Date          : 2025.01.12
// =================================================================
'use strict';

class GameState {
    #word;      // word to guess. private for improved control
    #uuid;      // "authentication" for rate.

    constructor(props) {
        // constants pulled from props:
        this.CLASSES = props.classes;               // classes / guess rating
        this.GRID_LOC = props.grid_loc;             // ID where grid will be built
        this.TOAST_ID = props.toast_id;             // ID where the toast msg is.
        this.WIN_RATINGS = props.win_ratings;       // list of win ratings to be used in the Toast
        this.DEBUG = props.debug | false;           // enable logging (true)

        // class-specified constants
        this.MIN_LENGTH = 3;
        this.MAX_LENGTH = 12;

        // settings
        this.wordLength = 5;
        this.guessCount = 6;

        // game-managed variables
        this.nGuesses = 0;          // which guess (row) in the grid 
        this.letter = 0;            // which letter of the guess (row)
        this.#word = "";            // word to guess
        this.guesses = [];          // all guesses from the user, for checking duplicates 
        this.ratings = [];          // all ratings for those guesses, for hints or other stuff.
        this.correct = false;       // whether user found the word 
        this.finished = false;      // if the game finished. used to prevent devtool abuse. I'm looking at you, cheater. 
        this.winner = false;        // whether user beat the bot

        // words and such
        this.allWords = [];         // Array of arrays. each array corresponds to word length (idx+3)
        this.gameWords = [];        // points to one of the arrays of allWords for ease of access.

        // major game objects
        this.grid = new Grid();
        this.grid.buildGrid(this.guessCount, this.wordLength, this.CLASSES, this.GRID_LOC);
        this.mgr = null;            // must be initialized later

        // class-managed attributes
        this.userStats = new Stats(this.DEBUG);
        this.botStats = new Stats(this.DEBUG);

        // create the keyboard
        this.keyboard = new Keyboard('#keyboard', this.CLASSES);

        // create keyboard listener
        document.addEventListener('keydown', (e) => this.#handleInput(e));
    }

    /**
     * initManager() - creates the instance of the bot manager (which creates the bot)
     */
    initManager() {
        // props is for the Manager
        const props = {
            mode: 2,    //Manager.MODE.ELIM,    // Eliminator bot.
            maxGuesses: this.guessCount,
            rate: this.rate,
            DEBUG: this.DEBUG,
        }

        // bot_props goes to bot via Manager
        const bot_props = {
            wordList: this.gameWords.slice(),
            length: this.wordLength,
            guesses: this.guessCount,
            DEBUG: this.DEBUG,
        }

        // instantiate the bot
        this.mgr = new Manager(props, bot_props);
    }

    /**
     * checkWinner() -- determines whether user or bot was correct in fewer guesses (W/L/Draw)
     *  User wins if # of user guesses < # of bot guesses
     *  bot wins if # of bot guesses < # of user guesses.
     *  Draws do not change win stats at all.
     */
    checkWinner() {
        // check if user beat the bot (or vice versa)
        if (this.nGuesses > this.mgr.bot.nGuesses) {
            this.botStats.addWin(true);
            this.userStats.addWin(false);
        } else if (this.nGuesses < this.mgr.bot.nGuesses) {
            this.botStats.addWin(false);
            this.userStats.addWin(true);
        } else {        // draw!
            // draw behavior: do not add to stats and do not modify streaks
            // however, if both lose (i.e. neither got the word), reset everything
            //if (this.nGuesses >= this.guessCount && this.mgr.bot.nGuesses >= this.guessCount) {
            //    this.botStats.addWin(false);
            //    this.userStats.addWin(false);
            //}
        }
    }

    /**
     * decrementLetter() -- handles logic for when a user presses bksp or similar.
     *  If letter > 0, decrement and change active cell
     *  otherwise, do not decrement.
     */
    decrementLetter() {
        // check boundaries (i.e., this.letter is <= 0, do nothing)
        if (this.letter > 0) {
            // move letter to previous cell
            this.letter--;
            this.grid.setCell(this.nGuesses, this.letter, '');
        }
    }

    /**
     * gameOver() -- user ran out of guesses. Update stats appropriately
     */
    gameOver() {
        this.#setFinished();
        this.setCorrect(false);
        this.checkWinner();
    }

    resetGameState() {
        // stop spinning restart button.
        document.querySelector('#Restart').classList.remove('spin');

        // ensure game words is OK. (this will also reset grid)
        this.setWordLength(this.wordLength);

        // reset keyboard
        this.keyboard.reset();

        // reset other game values
        this.nGuesses = 0;      // reset row
        this.letter = 0;        // reset col
        this.#selectWord();     // select a new word
        this.guesses = [];      // reset user's guesses
        this.correct = false;   // reset correct state
        this.winner = false;    // reset winner state
        this.finished = false;  // reset completed state

        // reinstantiate bot for new game (if it exists). otherwise, initialize.
        if (this.mgr) {
            this.mgr.reset(this.gameWords);
        } else {
            if (this.DEBUG) {
                Utils.log(this.mgr, "Manager is:");
                Utils.log(null, "Instantiating Manager")
            }
            this.initManager();
        }
        this.#checkBotCorrect();
    }

    /*** GETTERS & SETTERS ***/

    // getWord() -- returns the word. Will later add a means of auth.
    getWord() {
        return this.#word;
    }

    // getUserStats() -- returns this.userStats
    getUserStats() {
        return this.userStats.getStats();
    }

    // getBotStats() -- returns this.botStats
    getBotStats() {
        return this.botStats.getStats();
    }

    // setCorrect() -- enables the game to set whether the user is correct
    setCorrect(correct) {
        this.#setFinished();                // user played a game
        this.correct = correct;             // user is correct!
        this.userStats.addCorrect(correct); // update stats

        // debug msg
        if (this.DEBUG) {
            Utils.log(this.userStats.getStats().correct, "Correct:");
        }
    }

    // setGuessCount() -- appropriately set guess count. 
    setGuessCount(new_count) {
        if (new_length >= 1) {
            // set guess count
            this.guessCount = new_count;

            // update grid
            this.grid.setRowsCols(this.guessCount, this.wordLength);
        } else if (this.DEBUG) {
            Utils.log(this.guessCount, "Guess Count fails value assertion:")
        }
    }

    // setWordLength() -- appropriately set the word length. Also updates game words.
    setWordLength(new_length) {
        if (new_length >= this.MIN_LENGTH && new_length <= this.MAX_LENGTH) {
            // set to new length
            this.wordLength = +new_length;

            // also update game words
            this.gameWords = this.allWords[this.wordLength - this.MIN_LENGTH];

            // call grid to update.
            this.grid.setRowsCols(this.guessCount, this.wordLength);
        } else if (this.DEBUG) {
            Utils.log(this.wordLength, "Word Length fails value assertion:")
        }
    }

    // =================================================================
    // =
    // = PRIVATE HELPER FUNCTIONS
    // = 
    // =================================================================

    // determines whether bot was correct.
    #checkBotCorrect() {
        // regardless of win/lose, we know the bot played a game!
        this.botStats.addPlay();

        // figure out whether bot was correct
        if (this.mgr.bot.correct) {
            // bot won, adjust stats
            this.botStats.addCorrect(true);
        } else {
            // bot lost, adjust stats
            this.botStats.addCorrect(false);
        }
    }

    /**
     * checkGuess() - check whether the guess is correct
     * @param guess {String}    The guess to check
     */
    #checkGuess(guess) {
        // ensure guess is in the word list
        if (!this.gameWords.includes(guess)) {
            // issue toast that guess needs to be in word list
            this.#issueToast('Guess needs to be in word list');

            // debugs
            Utils.log(guess, "Guess not in word list:")
            Utils.log(this.gameWords, "Word list:")

            return;
        }

        // check for duplicates
        if (this.guesses.includes(guess)) {
            // issue toast that guess needs to be in word list
            this.#issueToast('You already made this guess');
            return;
        }

        // debug msg
        Utils.log(this.guess, "Guess:")
        Utils.log(this.guesses, "Guess list:")

        // rate the guess on the board
        let rating = this.rate.rateGuess(guess);
        this.ratings.push(rating);
        this.#showRating(guess, rating);

        // increment guess counter, as we have eliminated edge cases
        this.nGuesses++;
        this.guesses.push(guess);       // add the guess

        // check if user is correct
        if (guess.toUpperCase() === this.#word.toUpperCase()) {
            // user is correct!
            this.setCorrect(true);     // game correct

            // check if user beat the bot
            this.checkWinner();

            // issue toast
            this.#issueToast(this.WIN_RATINGS[this.nGuesses - 1]);

            // init end-game modal
            document.querySelector('#Ended').click();
            document.querySelector('#Restart').classList.add('spin');

            return;             // no need to execute anything else
        }

        // if this executes, game continues, user incorrect
        this.grid.highlightRow(this.nGuesses);   // highlight next row
        this.letter = 0;                    // reset to next letter

        // check if game over
        if (this.nGuesses >= this.guessCount) {
            this.gameOver();
            document.querySelector('#Ended').click();
        } else {
            return;
        }
    }

    // creates the Rate class. Exchanges a shared key for use to protect the word
    // I'm sure this isn't actually secure but it's fine. It's a game after all.
    #createRate() {
        if (this.rate) {
            this.rate.setWord(this.#word, this.#uuid);
        } else {
            this.#uuid = Utils.create_UUID()
            this.rate = new Rate(this.#word, this.#uuid);
        }
    }

    /**
     * handleInput - handles input from the keyboard (on-screen AND physical)
     * @param event {KeyboardEvent}     the keyboard event that occurred
     */
    #handleInput(e) {
        // if game is already complete, do nothing
        if (this.finished) {
            return;
        }

        // handle backspace or delete
        if (e.key === "Backspace" || e.key === "Delete") {
            e.preventDefault();
            this.decrementLetter();
        } else if (e.key === "Enter") {
            e.preventDefault();

            if (this.letter == this.wordLength) {
                // extract guess from game-board
                let guess = '';
                for (let i = 0; i < this.wordLength; i++) {
                    guess += this.grid.getCellValue(this.nGuesses, i);
                }

                // check the guess
                this.#checkGuess(guess)
            } else {        // guess isn't long enough, show msg
                this.#issueToast("Guess is incomplete!");
            }

        } else if (this.letter < this.wordLength && /^[a-z]$/i.test(e.key)) {
            this.grid.setCell(this.nGuesses, this.letter, e.key.toUpperCase());
            this.letter++;
        } else {
            // buffer is full, do nothing
        }
    }

    // issues a bootstrap toast upon errors or successful wins or whatever
    #issueToast(msg) {
        const toast = bootstrap.Toast.getOrCreateInstance(document.getElementById(this.TOAST_ID));
        document.querySelector('.toast-body').textContent = msg;   // update msg
        toast.show();       // show the toast
    }

    // picks the verse word
    #selectWord() {
        // interesting words to test: SLAYS, CORNY
        Utils.log(this.gameWords, "GAMEWORDS");
        this.#word = this.gameWords[Utils.rng(this.gameWords.length)].toUpperCase();
        this.#createRate();
        Utils.log(this.#word, "SECRET");
    }

    // enables game to set whether the user played (i.e. finished) the game.
    #setFinished() {
        // check if this has already been called this game.
        if (this.finished) {
            return;         // don't do anything to avoid overlap.
        }

        // has not been called yet. increment play counts, set flags, etc.
        this.userStats.addPlay();
        this.finished = true;
        if (this.DEBUG) {
            Utils.log(this.userStats.getStats().played, "Played:");
        }

        // game is finished, so we need to disable keyboard
        this.keyboard.setEnabled(false);
    }

    /**
     * showRating() - colors the row of cells according to the rating. 
     * Essentially performs the presentation of the rating.
     * 
     * @param {string} guess        user's guess
     * @param {Number[]} rating     rating of user's guess
     */
    #showRating(guess, rating) {
        for (var i = 0; i < rating.length; i++) {
            let cell, key;
            let letter = guess[i];
            let val = this.CLASSES[rating[i]]

            cell = this.grid.getCell(this.nGuesses, i);
            key = document.querySelector(`#key-${letter}`);

            cell.classList.add(val);
            this.keyboard.classifyKey(key, val, rating[i])
        }
    }
}