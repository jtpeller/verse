// =================================================================
// = game.js
// =  Description   : Implements game functionality
// =  Author        : jtpeller
// =  Date          : 2023-12-24
// =================================================================
'use strict';

/**
 * event listener to populate the page.
 */
document.addEventListener('DOMContentLoaded', function () {
    // CONSTANTS AND GLOBALS
    const DEFAULT_LEN = 5;    // the default word length to use
    const GUESS_RATINGS = ['incorrect', 'present', 'correct'];
    const WIN_RATINGS = ["HOW??", "Spectacular!", "Amazing", "Great", "Nice", "Phew!", "Fooey!"];
    const TOAST_ID = "toast-msg";
    const DEBUG = true;
    let bot;

    // object that contains user-settable options
    let gameSettings = {
        wordLength: DEFAULT_LEN,
        guessCount: 6, //defaultLength + 1,
        darkMode: true,
    };

    // object containing user's statistics
    let gameStats = {
        played: 0,
        won: 0,
        winperc: 0,
        currentStreak: 0,
        maxStreak: 0,
    };

    let allWords = [];      // array of all words, separated by length

    let gameWords = [];     // words for this specific game. all same length.

    let gameVars = {
        nGuesses: 0,        // which guess (row) in the grid
        letter: 0,          // which letter of the guess (row)
        word: "",           // word to guess
        guesses: [],        // all guesses from the user, for checking duplicates
        winner: false,      // whether the user has won or lost
        completed: false,   // if the game finished. used to prevent devtool abuse. I'm looking at you, cheater.
    }

    let botStats = {
        played: 0,
        won: 0,
        winperc: 0,
        currentStreak: 0,
        maxStreak: 0,
    };

    // initialize elements

    // enable tooltips everywhere 
    // ref: https://getbootstrap.com/docs/5.3/components/tooltips/#enable-tooltips
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

    // create modal functionality
    initModal();

    // create the grid
    initGrid();

    // create the keyboard
    initKeyboard();

    // initialize the words (which starts the game)
    initWords();

    // create keyboard listener
    document.addEventListener('keydown', (e) => handleInput(e));

    /**
     * initModal() - updates the site modal.
     * Based on https://getbootstrap.com/docs/5.3/components/modal/#varying-modal-content
     */
    function initModal() {
        const modal = document.querySelector('#modal');

        if (modal) {
            modal.addEventListener('show.bs.modal', event => {
                // figure out which modal to populate
                const btn = event.relatedTarget;
                const type = btn.getAttribute('data-bs-button');

                // set the title of the modal
                modal.querySelector('#modal-title').innerHTML = '';//type;

                // clear body of modal
                const body = modal.querySelector('#modal-body');
                body.innerHTML = '';

                // populate the rest of the modal with the specific content
                switch (type) {
                    case 'Help':
                        help(body);
                        break;
                    case 'Bot':
                        botAI(body);
                        break;
                    case 'Restart':
                        restart(body);
                        break;
                    case 'Stats':
                        stats(body);
                        break;
                    case 'Settings':
                        settings(body);
                        break;
                    case 'Ended':
                        ended(body);
                        break;
                }
            })
        }

        // these functions populate the modal body with <function_name> content
        // the body is the element object to populate, which should be the modal-body element.

        function settings(body) {
            let elems = [];

            elems.push(create('h1', {
                className: 'modal-header-1',
                textContent: 'Settings',
            }))

            // create the settings
            elems.push(
                createSetting('Word Length', 'Press one of these buttons to change the length of the word to guess!', 2, [3, gameSettings.wordLength, 12]),
            );

            // append to body
            body.append(...elems);

            function createSetting(name, desc, type, value) {
                let settingText = create('div', {
                    className: 'setting-text'
                })

                settingText.append(create('h3', {
                    className: 'modal-header-3',
                    textContent: name,
                }));

                settingText.append(create('p', {
                    className: 'modal-description',
                    textContent: desc,
                }));

                // figure out which type to build
                var inputDiv;
                var input;
                let div;        // div to return; parent div of setting

                switch(type) {

                case 0:     // checkboxes
                    inputDiv = create('div', {
                        className: 'form-check form-switch',
                    })

                    input = create('input', {
                        className: 'form-check-input',
                        type: 'checkbox',
                        role: 'switch',
                        id: `${name}-checkbox`,
                        checked: value,
                    })

                    inputDiv.append(input);

                    div = create('div', {className: 'settings-inline',})
                    break;

                case 1:     // slider
                    inputDiv = create('div', {
                        className: 'form-range',
                    })

                    input = create('input', {
                        className: 'form-range',
                        type: 'range',
                        min: 0,
                        value: value,
                        max: 5,
                        id: `${name}-range`,
                        checked: true,
                    })

                    inputDiv.append(input);
                    div = create('div', {className: 'settings-block',})
                    break;
                
                case 2:     // button grid
                    inputDiv = create('div', {
                        className: 'btn-grid',
                    });

                    let min = value[0];
                    let val = value[1];
                    let max = value[2];

                    for (var i = min; i <= max; i++) {
                        var classes = 'btn btn-dark setting-btn'

                        if (i === val) {
                            classes = 'btn btn-primary setting-btn';
                        }

                        // create each button
                        var btn = create('button', {
                            className: classes,
                            textContent: i,
                            value: i,
                            onclick: (e) => {
                                var btn = e.target;
                                gameSettings.wordLength = +btn.value;
                                gameSettings.guessCount = 6; //+btn.value + 1;

                                // rebuild grid based on this new setting
                                initGrid();

                                // repopulate the word list
                                initWords();

                                // restart game
                                startGame();  // clear out board, keyboard, etc.
                            }
                        })

                        inputDiv.append(btn);
                    }
                    div = create('div', {className: 'settings-block',})
                    break;
                }

                // create the div of the whole settings block
                div.append(settingText, inputDiv);
                return div;
            }
        }

        function help(body) {
            // title 
            const title = create('h1', {
                className: 'modal-header-1',
                textContent: 'How To Play',
            });

            // rules / important info
            const rules = [
                `Guess in ${gameSettings.guessCount} tries.`,
                'Each guess must exist in the word list',
            ];

            let relems = [];
            for (let i = 0; i < rules.length; i++) {
                relems.push(create('p', {
                    textContent: rules[i]
                }))
            }

            // correct / wrong spot / not present examples
            let examples = [];

            examples.push(create('p', {
                textContent: "Sounds like random guessing... but the game gives you some helpful hints along the way:"
            }));

            var titles = ["Incorrect Letters", "Getting Warmer", "Red Hot!"]
            var words = ["PRUDE", "BLINK", "TACOS"]
            var marks = [0, 1, 3];
            var classes = ['incorrect', 'present', 'correct'];
            var captions = [
                `The letter P is not in the word`,
                `The letter L is in the word but in the wrong spot.`,
                `The letter O is in the word and in the correct spot.`,
            ];

            for (let i = 0; i < words.length; i++) {
                // create each of the pairings of helper examples
                var helper = create('div')

                var helperTitle = create('h3', {
                    className: 'modal-header-2',
                    textContent: titles[i]
                })

                var helperGrid = create('div', { className: 'helper-grid' })
                var helperCells = create('div', { className: "game-row", id: `row-${i}` })

                // for the word length
                for (let j = 0; j < words[i].length; j++) {
                    // color it properly
                    var temp = 'game-cell';
                    if (j == marks[i]) {
                        temp = `game-cell ${classes[i]}`
                    }

                    // create a cell per row
                    helperCells.append(create('div', {
                        className: temp,
                        id: `cell-${j}`,
                        textContent: words[i][j]
                    }));

                }

                // set the proper letter as the right color
                helperGrid.append(helperCells);

                var helperCaption = create('p', {
                    innerHTML: captions[i]
                })

                // add everything to the helper div
                helper.append(helperTitle);
                helper.append(helperGrid);
                helper.append(helperCaption);

                // push the helper div to the examples array
                examples.push(helper);
            }

            body.append(title)
            body.append(...relems);
            body.append(...examples);
        }

        function botAI(body) {
            let elems = [];

            elems.push(create('h1', {
                className: 'modal-header-1',
                textContent: 'Bot Performance',
            }))

            elems.push(create('h2', {
                className: 'modal-header-2',
                textContent: `Bot Guesses`,
            }))

            const showGuesses = gameVars.completed && bot.guesses[0] !== undefined;

            if (showGuesses) {
                elems.push(create('p', {
                    className: 'text-center fst-italic',
                    textContent: 'The bot made this sequence of guesses'
                }))
            } else {
                elems.push(create('p', {
                    className: 'text-center fst-italic',
                    textContent: 'Guesses are hidden until you complete your guesses!'
                }))
            }

            // create each of the rows for the bot's guesses
            var botGrid = create('div', {className: 'game-grid', id: 'bot-grid'})
            for (let i = 0; i < gameSettings.guessCount; i++) {
                // we only SHOW the letters if user completed the game
                // and the guess exists. Always show the rating
                if (gameVars.completed && bot.guesses[i] !== undefined) {
                    botGrid.append(createRow(i, 'bot', bot.ratings[i], bot.guesses[i]));
                } else {
                    botGrid.append(createRow(i, 'bot', bot.ratings[i]));
                }
            }
            elems.push(botGrid);

            // append to body
            body.append(...elems);
        }

        function restart(body) {
            let elems = [];

            elems.push(create('h1', {
                className: 'modal-header-1',
                textContent: 'Restart',
            }));

            // populate body:
            // ... are you sure?
            elems.push(create('h1', {
                className: "modal-header-2",
                textContent: "Are you sure you want to restart? This won't affect your stats...",
            }))

            // ... confirm buttons
            const div = create('div', {
                className: 'text-end'
            })

            var cancel = create('button', {
                className: "btn btn-secondary w-100 m-1",
                innerText: "Cancel",
                onclick: (e) => {
                    document.querySelector('#modal-close-btn').click();
                }
            });

            var restart = create('button', {
                className: "btn btn-danger w-100 m-1",
                innerText: "Restart",
                onclick: (e) => {
                    document.querySelector('#modal-close-btn').click();
                    startGame();  // restart game logic
                }
            })

            // add these buttons to the div
            div.append(cancel);
            div.append(restart);

            // add div to elems
            elems.push(div);

            // add the div to the body
            body.append(...elems);

            return;
        }

        function stats(body) {
            let elems = [];
            elems.push(create('h1', {
                className: 'modal-header-1',
                textContent: 'Stats',
            }));

            // populate user stats:
            // ... title
            elems.push(create('h1', {
                className: 'modal-header-2',
                textContent: 'Your Stats',
            }));

            // ... user stats
            elems.push(buildStats(gameStats));

            // populate Bot stats:
            // ... title
            elems.push(create('h1', {
                className: 'modal-header-2',
                textContent: 'Bot Stats',
            }));

            // ... bot stats
            elems.push(buildStats(botStats));

            // add everything
            body.append(...elems);

            // helper function to aid in creating each of the stats
            function createStat(idx, label, stats) {
                var temp = create('div', { className: "stat text-center" })
                temp.append(create('h1', { className: "stat-val", textContent: stats[idx] }))
                temp.append(create('p', { className: "stat-label", textContent: label }))
                return temp;
            }

            // helper function to create the list of stats
            function buildStats(stats) {
                let div = create('div', { className: "stats" })

                div.append(createStat('played', 'Played', stats));
                div.append(createStat('winperc', 'Win %', stats));
                div.append(createStat('currentStreak', 'Current Streak', stats));
                div.append(createStat('maxStreak', 'Max Streak', stats));

                return div;
            }
        }

        function ended(body) {
            let elems = [];

            // title
            if (gameVars.winner) {
                elems.push(create('h1', {
                    className: 'modal-header-1',
                    textContent: 'You Win!',
                }));

                // show Bot performance:
                // ... Bot header
                elems.push(create('h2', {
                    className: 'modal-header-2',
                    textContent: 'Bot Performance',
                }));

                // ... Bot guess count
                elems.push(create('p', {
                    textContent: `The Bot Guessed in ${bot.nGuesses} guesses.`,
                }));

                // ... determination of how many guesses better or worse user did
                let guessDiff;
                if (gameVars.nGuesses < bot.nGuesses) {
                    guessDiff = create('p', {
                        textContent: `That means you guessed ${Math.abs(gameVars.nGuesses - bot.nGuesses)} fewer than the Bot! Great work!`
                    })
                } else if (gameVars.nGuesses == bot.nGuesses) {
                    guessDiff = create('p', {
                        textContent: `That means you tied with the Bot! Not bad!`
                    })
                } else {        // bot did better
                    guessDiff = create('p', {
                        textContent: `That means you guessed ${gameVars.nGuesses - bot.nGuesses} more than the Bot! Better luck next time!`
                    })
                }

                elems.push(guessDiff);
            } else {
                elems.push(create('h1', {
                    className: 'modal-header-1',
                    textContent: 'Drat!',
                }));

                elems.push(create('h2', {
                    className: 'modal-header-2',
                    textContent: 'The word was:',
                }))

                elems.push(create('h3', {
                    className: 'text-center',
                    textContent: gameVars.completed ? gameVars.word : 'Looks like we got ourselves a cheater!',
                }))
            }

            // buttons:
            var btndiv = create('div', {})

            // ... Button to show Bot modal
            btndiv.append(create('div', {
                className: 'btn btn-primary w-100 my-1',
                textContent: `Bot's Performance`,
                onclick: () => {
                    document.querySelector('#modal-close-btn').click();
                    setTimeout(() => {
                        document.querySelector('#Bot').click();
                    }, 250);
                }
            }))

            // ...Stats
            btndiv.append(create('div', {
                className: 'btn btn-primary w-100 my-1',
                textContent: `Stats`,
                onclick: () => {
                    document.querySelector('#modal-close-btn').click();
                    setTimeout(() => {
                        document.querySelector('#Stats').click();
                    }, 250);
                }
            }));

            // ...Play Again
            btndiv.append(create('div', {
                className: 'btn btn-primary w-100 my-1',
                textContent: `Play Another`,
                onclick: () => {
                    startGame();
                    document.querySelector('#modal-close-btn').click();
                }
            }));

            // append btndiv to list
            elems.push(btndiv);

            // push everything to the body
            body.append(...elems);
        }
    }

    /**
     * initGrid() - creates the game grid and subsequent game logic
     */
    function initGrid() {
        const grid = document.querySelector('#grid');
        grid.innerHTML = '';

        // for the number of guesses:
        for (let i = 0; i < gameSettings.guessCount; i++) {
            grid.append(createRow(i));
        }
    }

    /**
     * createRow() -- creates a game row thingy
     * @param {int} i | which row this is
     * @param {string} [prefix='']  | prefix for row ID
     * @param {string} [value='']   | value for the row to take on (i.e., a user's/bot's guess)
     */
    function createRow(i, prefix = '', rating = [], value = '', ) {
        var row = create('div', { 
            className: "game-row",
            style: `grid-template-columns: repeat(${gameSettings.wordLength}, 0fr);`,
            id: `${prefix}row-${i}` 
        })

        // for the word length
        for (let j = 0; j < gameSettings.wordLength; j++) {
            // for use when caller wants to define a rated row
            var cellClass = 'game-cell';
            if (rating != []) {
                cellClass += ' ' + GUESS_RATINGS[rating[j]]
            }

            // create a cell per row
            row.append(create('div', { 
                className: cellClass,
                id: `cell-${j}`,
                textContent: value[j],
            }));
        }

        return row;
    }

    /**
     * initKeyboard() - creates the game's keyboard at the bottom of the page
     *  and the subsequent behaviors
     */
    function initKeyboard() {
        const keyboard = document.querySelector('#keyboard');

        const vals = ['qwertyuiop', 'asdfghjkl', '&zxcvbnm*']

        // for each row
        for (const val of vals) {
            // create the row
            var row = create('div', { className: 'keyboard-row' })

            // for each char in val
            for (let i = 0; i < val.length; i++) {
                var txt = val[i];
                var key = val[i];

                if (txt === '&') {
                    txt = "ENTER";
                    key = "Enter";
                } else if (val[i] === '*') {
                    txt = "BKSP";
                    key = "Backspace";
                }

                var button = create('button', {
                    className: 'key',
                    textContent: txt.toUpperCase(),
                    id: `key-${txt.toUpperCase()}`,
                    value: key,
                })

                button.onclick = (e) => {
                    if (!gameVars.completed) {       // only dispatch if game is not complete
                        const btn = e.target;
                        const val = btn.getAttribute('value');
    
                        document.dispatchEvent(new KeyboardEvent(
                            'keydown', { 'key': val }
                        ))
                    }
                }

                row.append(button);
            }

            // append the row to the keyboard
            keyboard.append(row);
        }
    }

    /**
     * initWords() - initialize the word list
     */
    function initWords() {
        // to read in all the files without later issues, use promises
        let promises = [];
        for (let i = 3; i <= 12; i++) {
            promises.push(fetch(`words/words-${i}.txt`))
        }

        // promise the data
        Promise.all(promises).then(function (responses) {
            return Promise.all(responses.map(function (response) {
                return response.text();
            }));
        }).then(function (data) {       // handle the data
            for (let i = 0; i < data.length; i++) {
                // handle line endings because of course everything has to be complicated
                if (data[i].includes("\r\n")) {
                    allWords.push(data[i].toUpperCase().split("\r\n"));
                } else {
                    allWords.push(data[i].toUpperCase().split("\n"));
                }
            }
            
            // call startGame now
            startGame();
        })
    }

    /**
     * initBot() - creates the instance of the bot
     */
    function initBot() {
        // create the props
        const props = {
            wordList: structuredClone(gameWords),
            length: gameSettings.wordLength,
            guesses: gameSettings.guessCount,
            rateFunction: rateGuess,
            DEBUG: DEBUG,
        }

        // instantiate the bot
        bot = new Bot(props);

        // figure out why we left the loop (win or lose?)
        if (bot.correct) {
            // bot won, adjust stats
            addToStats(true, botStats);
        } else {
            // bot lost, adjust stats
            addToStats(false, botStats);
        }
    }

    /**
     * selectWord() - initialize the word
     */
    function selectWord() {
        // words to test: relic / block / verge / equip
        gameVars.word = gameWords[rng(gameWords.length)].toUpperCase();
    }

    /**
     * handleInput - handles input from the keyboard (on-screen AND physical)
     * @param event {KeyboardEvent}     the keyboard event that occurred
     */
    function handleInput(e) {
        // if game is already complete, do nothing
        if (gameVars.completed) {
            return;
        }

        // handle backspace or delete
        if (e.key === "Backspace" || e.key === "Delete") {
            e.preventDefault();

            // check boundaries (i.e., gameVars.letter is 0)
            if (gameVars.letter <= 0) {
                // do nothing; ignore bksp/delete if guess is empty
            } else {
                // move letter to previous cell
                gameVars.letter--;

                setCell(gameVars.nGuesses, gameVars.letter, '');
            }
        } else if (e.key === "Enter") {
            e.preventDefault();

            if (gameVars.letter == gameSettings.wordLength) {
                // extract guess from game-board
                let guess = '';
                for (let i = 0; i < gameSettings.wordLength; i++) {
                    guess += getCellValue(gameVars.nGuesses, i);
                }

                // check the guess
                checkGuess(guess)
            } else {        // guess isn't long enough
                // TBD: show a thing that says "incomplete"
            }

        } else if (gameVars.letter < gameSettings.wordLength && /^[a-z]$/i.test(e.key)) {
            setCell(gameVars.nGuesses, gameVars.letter, e.key.toUpperCase());
            gameVars.letter++;
        } else {
            // buffer is full, do nothing
        }
    }

    /**
     * checkGuess() - check whether the guess is correct
     * @param guess {String}    The guess to check
     */
    function checkGuess(guess) {
        // ensure guess is in the word list
        if (!gameWords.includes(guess)) {
            // issue toast that guess needs to be in word list
            issueToast('Guess needs to be in word list');

            // debug msg
            if (DEBUG) {
                console.log("Guess", guess, "not in word list");
                console.log("Word List:", gameWords);
            }

            return;
        }

        // check for duplicates
        if (gameVars.guesses.includes(guess)) {
            // issue toast that guess needs to be in word list
            issueToast('You already made this guess');
            return;
        }

        // debug msg
        if (DEBUG) {
            console.log(gameVars.guesses, guess);
        }

        // rate the guess on the board
        let rating = rateGuess(guess);
        showRating(guess, rating);

        // increment guess counter, as we have eliminated edge cases
        gameVars.nGuesses++;
        gameVars.guesses.push(guess);       // add the guess

        if (guess.toUpperCase() === gameVars.word.toUpperCase()) {
            // create winner modal
            gameVars.winner = true;
            gameVars.completed = true;
            issueToast(WIN_RATINGS[gameVars.nGuesses-1]);
            document.querySelector('#Ended').click();
            document.querySelector('#Restart').classList.add('spin');

            // add to user's stats
            addToStats(true, gameStats);
            return;             // no need to execute anything else
        }

        // if this executes, game continues, user incorrect
        highlightRow(gameVars.nGuesses);    // highlight next row
        gameVars.letter = 0;        // reset to next letter

        // check if game over
        if (gameVars.nGuesses >= gameSettings.guessCount) {
            gameVars.winner = false;
            gameVars.completed = true;
            document.querySelector('#Ended').click();
        } else {
            return;
        }
    }

    /**
     * rateGuess() - compute the results of the guess
     * @param {string} guess 
     * 
     * @returns {Number[]}      guess rating. 0 = incorrect, 1 = present, 2 = correct
     */
    function rateGuess(guess) {
        // alternative checking method that'll take longer to compute, but more accurate
        let wordCopy = gameVars.word;
        let rating = Array(gameSettings.wordLength).fill(0);
        var temp = guess.toUpperCase();
        
        // loop thru the word, checking for identicals
        for (let i = 0; i < gameSettings.wordLength; i++) {
            let letter = temp[i];

            if (gameVars.word[i] === letter) {
                // set the rating
                rating[i] = 2;

                // any letter marked as correct should be removed from the wordcopy
                wordCopy = wordCopy.replace(letter, ' ');
            } 
        }

        // now, check remaining letters to see if they exist in the word
        for (let i = 0; i < gameSettings.wordLength; i++) {
            let letter = temp[i];

            if (gameVars.word.includes(letter) && wordCopy.includes(letter) ) {
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

    /**
     * showRating() - colors the row of cells according to the rating. 
     * Essentially performs the presentation of rateGuess().
     * 
     * @param {string} guess        user's guess
     * @param {Number[]} rating     rating of user's guess produced by rateGuess()
     */
    function showRating(guess, rating) {
        for (var i = 0; i < rating.length; i++) {
            let cell, key;
            let letter = guess[i];
            let val = GUESS_RATINGS[rating[i]]
            
            cell = getCell(gameVars.nGuesses, i);
            key = document.querySelector(`#key-${letter}`);

            cell.classList.add(val);
            classifyKey(key, val, rating[i])
        }
    }

    /**
     * addToStats() - increments stats based on winner/loser
     * @param {Boolean} winner      winner if true, false otherwise
     * @param {Object} statsObj     which stats object to update (either gameStats or botStats)
     */
    function addToStats(winner, statsObj) {
        statsObj.played++;

        if (winner) {
            statsObj.won++;
            statsObj.currentStreak++;

            if (statsObj.currentStreak > statsObj.maxStreak) {
                statsObj.maxStreak = statsObj.currentStreak;
            }
        } else {
            // user lost, change streak to 0
            statsObj.currentStreak = 0;
        }

        // update win %
        statsObj.winperc = statsObj.won / statsObj.played;
    }

    /**
     * startGame() - init the board and whatnot. Can be used to restart the game.
     */
    function startGame() {
        gameVars.winner = false;
        document.querySelector('#Restart').classList.remove('spin');
        
        // clear the grid
        const classesToRemove = ['correct', 'present', 'incorrect'];
        for (var i = 0; i < gameSettings.guessCount; i++) {
            for (var j = 0; j < gameSettings.wordLength; j++) {
                // empty cell contents
                setCell(i, j, '');

                // remove classes
                getCell(i, j).classList.remove(...classesToRemove);
            }
        }

        // clear keyboard
        const alphabets = [...Array(26).keys()].map((n) => String.fromCharCode(65 + n));
        for (let idx in alphabets) {
            var a = alphabets[idx];
            document.querySelector(`#key-${a}`).classList.remove(...classesToRemove);
        }

        // point gameWords to the correct allWords entry
        gameWords = allWords[gameSettings.wordLength-3];

        // reset game vars
        gameVars.nGuesses = 0;      // reset row
        gameVars.letter = 0;        // reset col
        selectWord();               // select a new word
        gameVars.guesses = [];      // reset user's guesses
        gameVars.winner = false;    // reset winner state
        gameVars.completed = false; // reset completed state

        // highlight which row is current
        highlightRow(gameVars.nGuesses);

        // re-init bot
        initBot();      // wordList remains the same, so I can call this a-OK
    }

    /** highlights the provided row, as indication of which guess we're on */
    function highlightRow(num) {
        if (num < 0 || num >= gameSettings.guessCount) {
            //console.error('Invalid row number: ' + num);
            return;
        }

        // loop through all others and remove highlighted
        for (let i = 0; i < gameSettings.guessCount; i++) {
            document.querySelector(`#row-${i}`).classList.remove('highlighted');
        }
        document.querySelector(`#row-${num}`).classList.add('highlighted');
    }

    /** returns a randomly generated number between 0 and max */
    function rng(max) {
        return Math.floor(Math.random() * max);
    }

    /** wrapper for Object.assign. elem = element to create (e.g., 'a' or 'div' or 'h1') */
    function create(elem, options) {
        return Object.assign(document.createElement(elem), options)
    }

    /**
     * getCellValue() - helper function to get value of the row x cell
     * @param row {Number}      which row to select
     * @param cell {Number}     which cell of the row to select
     * @returns {String}        the text inside the cell
     */
    function getCellValue(row, cell) {
        var row = document.querySelector(`#row-${row}`);
        var cell = row.querySelector(`#cell-${cell}`);
        return cell.innerText;
    }

    /**
     * getCell() - helper function to retrieve the row x cell
     * @param row {Number}      which row to select
     * @param cell {Number}     which cell of the row to select
     * @returns {Element}       the cell Element
     */
    function getCell(row, cell) {
        var row = document.querySelector(`#row-${row}`);
        return row.querySelector(`#cell-${cell}`);
    }

    /**
     * setCell() - helper function to select the row x cell
     *  and to set its value
     * @param row {Number}      which row to select
     * @param cell {Number}     which cell of the row to select
     * @param value {String}    a single character to set the cell to
     */
    function setCell(row, cell, value) {
        var row = document.querySelector(`#row-${row}`);
        var cell = row.querySelector(`#cell-${cell}`);
        cell.textContent = value;
        cell.classList.add('animated-cell');

        setTimeout(() => {
            cell.classList.remove('animated-cell');
        }, 400);   // after a bit, remove the class
    }

    /** classify key under certain rules: correct > incorrect > not present */
    function classifyKey(key, class_name, priority) {
        let classes = key.classList;    // get current classes
        let arr = Array.from(classes);

        // check if the key is not classed
        if (classes.length <= 1) {
            // just assign provided class
            key.classList.add(class_name);
            return;
        }

        // now, check class priority
        if (priority == 2) {
            // always overwrite current to priority 2
            key.classList.add(class_name);
        } else if (priority == 1 && !arr.includes(GUESS_RATINGS[2])) {
            // only assign if current class is lower priority
            key.classList.add(class_name);
        } else {    // current class will be higher priority
            return;
        }
    }

    /** issues a bootstrap toast upon errors or successful wins or whatever */
    function issueToast(msg) {
        const toast = bootstrap.Toast.getOrCreateInstance(document.getElementById(TOAST_ID));
        document.querySelector('.toast-body').textContent = msg;   // update msg
        toast.show();       // show the toast
    }
});

