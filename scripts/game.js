// =================================================================
// = game.js
// =  Description   : Implements game functionality
// =  Author        : jtpeller
// =  Date          : 2023.12.24
// =================================================================
'use strict';

/**
 * event listener to populate the page.
 */
document.addEventListener('DOMContentLoaded', function () {
    // CONSTANTS AND GLOBALS
    const MODAL_LOC = '#modal';
    const DEBUG = false;
    let help_html = '';

    // TODO: Implement hints.
    if (window.location.search.includes("help=")) {
        let hints = document.querySelector("#hints");
        hints.classList.remove("invisible");
    }

    // initialize Game State obj
    let gameState = new GameState({
        classes: ['incorrect', 'present', 'correct'],
        grid_loc: "#grid",
        toast_id: "toast-msg",
        win_ratings: ["HOW??", "Spectacular!", "Amazing!", "Great!", "Nice!", "Phew!", "Fooey!"],
        debug: DEBUG
    });

    // enable tooltips everywhere 
    // ref: https://getbootstrap.com/docs/5.3/components/tooltips/#enable-tooltips
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))

    /*** BEGIN GAME INITIALIZATION ***/

    // create modal functionality
    let modal_funcs = [help_modal, botAI, restart, stats, settings, ended];
    let modal = new Modal(MODAL_LOC, modal_funcs);

    // initialize the words (which starts the game)
    Utils.promiseWords(wordsCallback);

    // =================================================================
    // =
    // = FUNCTIONS & GAME LOGIC
    // =
    // =================================================================

    function wordsCallback(data) {       // handle the data
        for (let i = 0; i < data.length; i++) {
            // handle line endings because of course everything has to be complicated
            if (data[i].includes("\r\n")) {
                gameState.allWords.push(data[i].toUpperCase().split("\r\n"));
            } else {
                gameState.allWords.push(data[i].toUpperCase().split("\n"));
            }
        }

        // call startGame now
        startGame();
    }

    /**
     * startGame() - init the board and whatnot. Can be used to restart the game.
     */
    function startGame() {
        // stop the spinning restart
        document.querySelector('#Restart').classList.remove('spin');

        // reset game state: bot manager, game variables, etc., but NOT stats!
        gameState.resetGameState();
    }

    // callback for when the game ends.
    function endGame() {
        document.querySelector('#modal-close-btn').click();
        setTimeout(() => {
            document.querySelector('#Ended').click();   // trigger ending modal.
        }, 250);
    }

    // =================================================================
    // =
    // = MODAL CREATION
    // =
    // =================================================================

    // builds the settings modal
    function settings() {
        let elems = [];

        elems.push(Utils.create('h1', {
            className: 'modal-h1',
            textContent: 'Settings',
        }))

        // create the settings
        elems.push(
            createSetting('Word Length', 'Press one of these buttons to change the length of the word to guess!', [3, gameState ? gameState.wordLength : 5, 12]),
        );

        // append to body
        let body = Utils.create('div', {})
        body.append(...elems);
        return body;
    }

    // builds the help modal
    function help_modal() {
        //// we can speed this up with flags.
        if (help_html != '') {
            let body = Utils.create('div', {})
            body.innerHTML = help_html;
            return body;
        }

        // title 
        const title = Utils.create('h1', {
            className: 'modal-h1',
            textContent: 'How To Play',
        });

        // rules / important info
        const rules = [
            `Guess in ${gameState ? gameState.guessCount : 6} tries.`,
            'Each guess must exist in the word list',
        ];

        let relems = [];
        for (let i = 0; i < rules.length; i++) {
            relems.push(Utils.create('p', {
                textContent: rules[i]
            }))
        }

        // correct / wrong spot / not present examples
        let examples = [];

        examples.push(Utils.create('p', {
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
            var helper = Utils.create('div')

            var helperTitle = Utils.create('h3', {
                className: 'modal-h2',
                textContent: titles[i]
            })

            var helperGrid = Utils.create('div', { className: 'helper-grid' })
            var helperCells = Utils.create('div', { className: "game-row", id: `row-${i}` })

            // for the word length
            for (let j = 0; j < words[i].length; j++) {
                // color it properly
                var temp = 'game-cell';
                if (j == marks[i]) {
                    temp = `game-cell ${classes[i]}`
                }

                // create a cell per row
                helperCells.append(Utils.create('div', {
                    className: temp,
                    id: `cell-${j}`,
                    textContent: words[i][j]
                }));

            }

            // set the proper letter as the right color
            helperGrid.append(helperCells);

            var helperCaption = Utils.create('p', {
                innerHTML: captions[i]
            })

            // add everything to the helper div
            helper.append(helperTitle);
            helper.append(helperGrid);
            helper.append(helperCaption);

            // push the helper div to the examples array
            examples.push(helper);
        }

        // append to body
        let body = Utils.create('div', {})
        body.append(title)
        body.append(...relems);
        body.append(...examples);

        help_html = body.innerHTML;

        return body;
    }

    // builds the Bot performance modal
    function botAI() {
        let elems = [];

        elems.push(Utils.create('h1', {
            className: 'modal-h1',
            textContent: 'Bot Performance',
        }))

        elems.push(Utils.create('h2', {
            className: 'modal-h2',
            textContent: `Bot Guesses`,
        }))

        const showGuesses = gameState.finished && gameState.mgr.bot.guesses[0] !== undefined;

        if (showGuesses) {
            elems.push(Utils.create('p', {
                className: 'text-center fst-italic',
                textContent: 'The bot made this sequence of guesses'
            }))
        } else {
            elems.push(Utils.create('p', {
                className: 'text-center fst-italic',
                textContent: 'Guesses are hidden until you complete your guesses!'
            }))
        }

        // create each of the rows for the bot's guesses
        var botGrid = Utils.create('div', { className: 'game-grid', id: 'bot-grid' })
        for (let i = 0; i < gameState.guessCount; i++) {
            // we only SHOW the letters if user completed the game
            // and the guess exists. Always show the rating
            if (showGuesses) {
                botGrid.append(gameState.grid.createRow(i, 'bot', gameState.mgr.ratings[i], gameState.mgr.bot.guesses[i]));
            } else {
                botGrid.append(gameState.grid.createRow(i, 'bot', gameState.mgr.ratings[i]));
            }
        }
        elems.push(botGrid);

        // append to body
        let body = Utils.create('div', {})
        body.append(...elems);

        // return the HTML
        return body;
    }

    // builds the restart modal
    function restart() {
        let elems = [];

        elems.push(Utils.create('h1', {
            className: 'modal-h1',
            textContent: 'Restart',
        }));

        // populate body:
        // ... are you sure?
        elems.push(Utils.create('h1', {
            className: "modal-h2",
            textContent: "Are you sure you want to restart? You'll keep your stats...",
        }))

        // ... confirm buttons
        const div = Utils.create('div', {
            className: 'text-end'
        })

        var cancel = Utils.create('button', {
            className: "btn btn-secondary w-100 m-1",
            innerText: "Cancel",
            onclick: (e) => {
                document.querySelector('#modal-close-btn').click();
            }
        });

        var restart = Utils.create('button', {
            className: "btn btn-danger w-100 m-1",
            innerText: "Restart",
            onclick: ((e) => {
                document.querySelector('#modal-close-btn').click();
                if (gameState) {
                    gameState.resetGameState();        // restart game logic
                }
            })
        })

        // on the restart panel, if user completed game, enable show-win-screen button
        var showEndScreen = Utils.create('button', {
            className: "btn btn-success w-100 m-1",
            innerText: "Show End Screen",
            onclick: endGame
        })

        // add these buttons to the div
        div.append(cancel);
        div.append(restart);
        if (gameState && gameState.finished) {
            div.append(showEndScreen);
        }

        // add div to elems
        elems.push(div);

        // add the div to the body
        let body = Utils.create('div', {})
        body.append(...elems);
        return body;
    }

    // builds the stats modal
    function stats() {
        let elems = [];
        elems.push(Utils.create('h1', {
            className: 'modal-h1',
            textContent: 'Stats',
        }));

        // populate user stats:
        // ... title
        elems.push(Utils.create('h1', {
            className: 'modal-h2',
            textContent: 'Your Stats',
        }));

        // ... user stats
        elems.push(buildStats(gameState.getUserStats()));

        // populate Bot stats:
        // ... title
        elems.push(Utils.create('h1', {
            className: 'modal-h2',
            textContent: 'Bot Stats',
        }));

        // ... bot stats
        elems.push(buildStats(gameState.getBotStats()));

        // add everything
        let body = Utils.create('div', {})
        body.append(...elems);
        return body;
    }

    // builds the end-game modal
    function ended() {
        let elems = [];

        // title
        if (gameState.correct) {
            elems.push(Utils.create('h1', {
                className: 'modal-h1',
                textContent: 'Correct!',
            }));

            // show Bot performance:
            // ... Bot header
            elems.push(Utils.create('h2', {
                className: 'modal-h2',
                textContent: 'Bot Performance',
            }));

            // ... Bot guess count
            elems.push(Utils.create('p', {
                textContent: `The Bot Guessed in ${gameState.mgr.bot.nGuesses} guesses.`,
            }));

            // ... determination of how many guesses better or worse user did
            let guessDiff;
            if (gameState.nGuesses < gameState.mgr.bot.nGuesses) {
                guessDiff = Utils.create('p', {
                    textContent: `That means you guessed ${Math.abs(gameState.nGuesses - gameState.mgr.bot.nGuesses)} fewer than the Bot! Great work!`
                })
            } else if (gameState.nGuesses == gameState.mgr.bot.nGuesses) {
                guessDiff = Utils.create('p', {
                    textContent: `That means you tied with the Bot! Not bad!`
                })
            } else {        // bot did better
                guessDiff = Utils.create('p', {
                    textContent: `That means you guessed ${gameState.nGuesses - gameState.mgr.bot.nGuesses} more than the Bot! Better luck next time!`
                })
            }

            elems.push(guessDiff);
        } else {
            elems.push(Utils.create('h1', {
                className: 'modal-h1',
                textContent: 'Drat!',
            }));

            elems.push(Utils.create('h2', {
                className: 'modal-h2',
                textContent: 'The word was:',
            }))

            elems.push(Utils.create('h3', {
                className: 'text-center',
                textContent: gameState.finished ? gameState.getWord() : 'Looks like we got ourselves a cheater!',
            }))
        }

        // buttons:
        var btndiv = Utils.create('div', {})

        // ... Button to show Bot modal
        btndiv.append(Utils.create('div', {
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
        btndiv.append(Utils.create('div', {
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
        btndiv.append(Utils.create('div', {
            className: 'btn btn-primary w-100 my-1',
            textContent: `Play Another`,
            onclick: () => {
                document.querySelector('#modal-close-btn').click();
                gameState.resetGameState();
            }
        }));

        // append btndiv to list
        elems.push(btndiv);

        // push everything to the body
        let body = Utils.create('div', {})
        body.append(...elems);
        return body;
    }

    function createSetting(name, desc, value) {
        let settingText = Utils.create('div', {
            className: 'setting-text'
        })

        settingText.append(Utils.create('h3', {
            className: 'modal-header-3',
            textContent: name,
        }));

        settingText.append(Utils.create('p', {
            className: 'modal-description',
            textContent: desc,
        }));

        // Build the button grid
        var inputDiv;
        let div;        // div to return; parent div of setting

        inputDiv = Utils.create('div', {
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
            var btn = Utils.create('button', {
                className: classes,
                textContent: i,
                value: i,
                onclick: ((e) => {
                    // determine which button was pressed and update.
                    var btn = e.target;

                    // remove old button color
                    var prev_btn = document.querySelector('.btn-grid').querySelector('.btn-primary')
                    prev_btn.classList.remove('btn-primary');
                    prev_btn.classList.add('btn-dark');

                    // update button color
                    btn.classList.remove('btn-dark');
                    btn.classList.add('btn-primary');

                    // ensure gameState exists
                    if (gameState) {
                        // update word length. this also updates the game word list & grid.
                        gameState.setWordLength(+btn.value);

                        // restart game
                        gameState.resetGameState();
                    }
                }).bind(this),
            })

            inputDiv.append(btn);
        }
        div = Utils.create('div', { className: 'settings-block', })

        // create the div of the whole settings block
        div.append(settingText, inputDiv);
        return div;
    }

    // helper function to aid in creating each of the stats
    function createStat(idx, label, stats) {
        var temp = Utils.create('div', { className: "stat text-center" })
        let text = "";

        // properly treat percentages
        if (label.includes("%")) {
            text = Math.trunc(stats[idx] * 100) + "%";
        } else {
            text = Math.trunc(stats[idx]);
        }

        // create values
        temp.append(Utils.create('h1', { className: "stat-val", textContent: text }))
        temp.append(Utils.create('p', { className: "stat-label", textContent: label }))
        return temp;
    }

    // helper function to create the list of stats
    function buildStats(stats) {
        let div = Utils.create('div', { className: "stats" })

        div.append(createStat('played', 'Games Played', stats));
        div.append(createStat('correct', 'Games Correct', stats));
        div.append(createStat('correctperc', 'Correct %', stats));
        div.append(createStat('won', 'Games Won', stats));
        div.append(createStat('winperc', 'Win %', stats));
        div.append(createStat('currentStreak', 'Current Streak', stats));
        div.append(createStat('maxStreak', 'Max Streak', stats));

        return div;
    }

});

