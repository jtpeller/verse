// =================================================================
// = bot.js
// =  Description   : Implements bot functionality
// =  Author        : jtpeller
// =  Date          : 2023.12.31
// =================================================================
'use strict';

class Bot {
    /**
     * builds the bot to be used for the game
     * @param {Object} props            | contains these fields:
     *      @field {String[]} wordList  | word list (all same length)
     *      @field {int} wordCount      | wordList array length
     *      @field {int} length         | word length
     *      @field {int} maxGuesses     | maximum number of guesses
     *      @field {function} rate      | function from instantiator to rate a guess
     *      @field {boolean} DEBUG      | used for output debugging.
     */
    constructor(props) {
        // pulled from props
        this.wordList = props.wordList;
        this.wordCount = props.wordList.length;
        this.length = props.length;
        this.maxGuesses = props.guesses;
        this.rate = props.rateFunction;
        this.DEBUG = props.DEBUG | false;

        // create now
        this.regex = Array(this.length).fill(`[ABCDEFGHIJKLMNOPQRSTUVWXYZ]+`);
        this.FACTOR = 2;       // factor to weight flagged letters

        // create later
        this.nGuesses = 0;      // number of guesses made    
        this.prob = [];         // letter counts
        this.scores = [];       // score based on how many words will be eliminated
        this.guesses = [];      // array of guesses. Array<String>
        this.ratings = [];      // array of ratings. Array<Array[int]>
        this.correct = false;   // whether the bot found the correct word.
        this.flagged = [];      // array of letters marked "present"

        // starts the game
        this.PlayGame();
    }

    /**
     * PlayGame() -- starting point for the bot.
     */
    PlayGame() {
        /** 
         * the general process of the bot is as follows:
         * 1) count each letter in the word list and store in an array (i.e., call countEachLetter)
         * 2) score each word in the word list (i.e., call scoreEachWord)
         * 3) select a word from the wordList as a guess
         * 4) determine the rating of this guess
         * 5) check if guess is correct
         * 6) eliminate words in the word list using this rating
         * 7) go to 1, until either maxGuesses is reached or the guess is correct.
         */
        for (let i = 0; i < this.maxGuesses; i++) {
            // step 1: count
            this.countUniqueLetters();
            this.log(this.prob, 'Letters:');

            // step 2: score
            this.scoreEachWord();
            this.log(this.scores, 'Scores:');

            // step 3: select
            var guess = this.selectGuessFromScore();
            this.guesses.push(guess);
            this.nGuesses++;
            this.log(guess, "Guess:");

            // step 4: rate
            var rating = this.rate(guess);
            this.ratings.push(rating);
            this.log(rating, 'Rating:');

            // step 5: check if correct
            if (!rating.includes(0) && !rating.includes(1)) {
                // guess is correct! we can exit the loop
                this.correct = true;
                break;
            }

            // step 6: filter
            // getting here means bot is incorrect. update word list
            this.updateWords(guess, rating);
        }

        // now, there are two possibilities: bot was correct, or bot exhausted guesses
        // either way, game is over
        return;
    }

    // everything below this comment is a helper function

    /**
     * using wordList, the bot calculates the probability
     * of each letter existing
     */
    countUniqueLetters() {
        // letters holds the count of each letter
        let letters = {};
            
        // loop through list
        for (let i = 0; i < this.wordCount; i++) {
            // Set to avoid skewing toward multi-occurrence letters
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
        // remove the flagged letter after use.
        for (let i = 0; i < this.flagged.length; i++) {
            var flag = this.flagged[i];
            letters[flag] *= this.FACTOR;
            this.flagged.splice(this.flagged.indexOf(flag), 1);
        }

        // store it for later use
        this.prob = structuredClone(letters);
        return;
    }

    /**
     * getter function to retrieve the probability of a letter
     * (note: this has to access this.prob, leave as method)
     */
    getProbabilityOfLetter(letter) {
        if (!this.isAlpha(letter)) {
            return 1;       // no effect
        }
        return this.prob[letter];
    }

    /**
     * rank each word in the word list
     */
    scoreEachWord() {
        // loop through the words and compare to the probabilities
        let scores = Array(this.wordCount).fill(0);

        // loop through the words and compute the scores
        for (let i = 0; i < this.wordCount; i++) {
            let word = this.wordList[i];
            scores[i] = this.scoreWord(word);
        }

        // save this as an attribute
        this.scores = structuredClone(scores);
        return;
    }

    // helper function to offload work of scoring a single word
    scoreWord(word) {
        let temp = structuredClone(word);
        let score = 1;
        for (let j = 0; j < word.length; j++) {
            score += this.getProbabilityOfLetter(temp[j]);
            
            // after scoring, remove instances of the letter (to avoid counting it twice)
            temp = temp.replaceAll(word[j], ' ');
        }

        return score;
    }

    /**
     * using the scoring array, compute a guess
     */
    selectGuessFromScore() {
        // with the scores, find the maximum score and select that word
        let idxOfMaxScore = -1;
        let maxScore = -1;
        for (let i = 0; i < this.scores.length; i++) {
            if (maxScore < this.scores[i]) {
                maxScore = this.scores[i];
                idxOfMaxScore = i;
            }
        }

        return this.wordList[idxOfMaxScore];
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
            this.log(this.regex, "Regex:");
        }
    }

    /**
     * using the provided rating, the bot updates the word list
     */
    updateWords(guess, rating) {
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
        this.log(this.flagged, "Flagged:");

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

    // check if word contains only A-Z.
    isAlpha(word) {
        return /^[A-Z]+$/.test(word);
    }

    // log value
    log(value, name="") {
        if (this.DEBUG) {
            console.log(name, JSON.parse(JSON.stringify(value)));
        }
    }
}