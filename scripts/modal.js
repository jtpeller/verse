// =================================================================
// = grid.js
// =  Description   : Implements Modal class for Verse! game
// =  Author        : jtpeller
// =  Date          : 2025.01.09
// =================================================================
'use strict';

class Modal {
    constructor(loc, gameState) {
        this.loc = loc;

        this.modal = document.querySelector(loc);
        if (!this.modal) {
            throw new Error('Modal location does not exist.')
        }

        // extract provided attributes
        this.gameState = gameState;

        // ... flags for checking whether the selected modal is built.
        this.helpBuilt = false;
        this.helpHTML = '';
        
        // create the event listener for the modal
        this.modal.addEventListener('show.bs.modal', ((event) => {
            // figure out which modal to populate
            const type = event.relatedTarget.getAttribute('data-bs-button');
    
            // set the title of the modal
            modal.querySelector('#modal-title').innerHTML = '';//type;
    
            // clear body of modal
            const modal_body = modal.querySelector('#modal-body');
            modal_body.innerHTML = '';
    
            // populate the rest of the modal with the specific content
            switch (type) {
                case 'Help':
                    this.#help(modal_body);
                    break;
                case 'Bot':
                    this.#botAI(modal_body);
                    break;
                case 'Restart':
                    this.#restart(modal_body);
                    break;
                case 'Stats':
                    this.#stats(modal_body);
                    break;
                case 'Settings':
                    this.#settings(modal_body);
                    break;
                case 'Ended':
                    this.#ended(modal_body);
                    break;
            }
        }).bind(this));
    }

    // builds the settings modal
    #settings(body) {
        let elems = [];

        elems.push(Utils.create('h1', {
            className: 'modal-h1',
            textContent: 'Settings',
        }))

        // create the settings
        elems.push(
            this.#createSetting('Word Length', 'Press one of these buttons to change the length of the word to guess!', 2, [3, this.gameState ? this.gameState.wordLength : 5, 12]),
        );

        // append to body
        body.append(...elems);
    }

    // builds the help modal
    #help(body) {
        // we can speed this up with flags.
        if (this.helpBuilt) {
            body.innerHTML = this.helpHTML;
            return;
        }

        // title 
        const title = Utils.create('h1', {
            className: 'modal-h1',
            textContent: 'How To Play',
        });

        // rules / important info
        const rules = [
            `Guess in ${this.gameState ? this.gameState.guessCount : 6} tries.`,
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

        body.append(title)
        body.append(...relems);
        body.append(...examples);

        this.helpBuilt = true;      // help modal has been built.
        this.helpHTML = body.innerHTML;
    }

    // builds the Bot performance modal
    #botAI(body) {
        let elems = [];

        elems.push(Utils.create('h1', {
            className: 'modal-h1',
            textContent: 'Bot Performance',
        }))

        elems.push(Utils.create('h2', {
            className: 'modal-h2',
            textContent: `Bot Guesses`,
        }))

        const showGuesses = this.gameState.finished && this.gameState.mgr.bot.guesses[0] !== undefined;

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
        var botGrid = Utils.create('div', {className: 'game-grid', id: 'bot-grid'})
        for (let i = 0; i < this.gameState.guessCount; i++) {
            // we only SHOW the letters if user completed the game
            // and the guess exists. Always show the rating
            if (showGuesses) {
                botGrid.append(this.gameState.grid.createRow(i, 'bot', this.gameState.mgr.ratings[i], this.gameState.mgr.bot.guesses[i]));
            } else {
                botGrid.append(this.gameState.grid.createRow(i, 'bot', this.gameState.mgr.ratings[i]));
            }
        }
        elems.push(botGrid);

        // append to body
        body.append(...elems);
    }

    // builds the restart modal
    #restart(body) {
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
                if (this.gameState) {
                    this.gameState.resetGameState();        // restart game logic
                }
            }).bind(this)
        })

        // on the restart panel, if user completed game, enable show-win-screen button
        var showEndScreen = Utils.create('button', {
            className: "btn btn-success w-100 m-1",
            innerText: "Show End Screen",
            onclick: (e) => {
                document.querySelector('#modal-close-btn').click();
                setTimeout(() => {
                    document.querySelector('#Ended').click();   // trigger ending modal.
                }, 250);
            }
        })

        // add these buttons to the div
        div.append(cancel);
        div.append(restart);
        if (this.gameState && this.gameState.finished) {
            div.append(showEndScreen);
        }

        // add div to elems
        elems.push(div);

        // add the div to the body
        body.append(...elems);

        return;
    }

    // builds the stats modal
    #stats(body) {
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
        elems.push(this.#buildStats(this.gameState.getUserStats()));

        // populate Bot stats:
        // ... title
        elems.push(Utils.create('h1', {
            className: 'modal-h2',
            textContent: 'Bot Stats',
        }));

        // ... bot stats
        elems.push(this.#buildStats(this.gameState.getBotStats()));

        // add everything
        body.append(...elems);
    }

    // builds the end-game modal
    #ended(body) {
        let elems = [];

        // title
        if (this.gameState.correct) {
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
                textContent: `The Bot Guessed in ${this.gameState.mgr.bot.nGuesses} guesses.`,
            }));

            // ... determination of how many guesses better or worse user did
            let guessDiff;
            if (this.gameState.nGuesses < this.gameState.mgr.bot.nGuesses) {
                guessDiff = Utils.create('p', {
                    textContent: `That means you guessed ${Math.abs(this.gameState.nGuesses - this.gameState.mgr.bot.nGuesses)} fewer than the Bot! Great work!`
                })
            } else if (this.gameState.nGuesses == this.gameState.mgr.bot.nGuesses) {
                guessDiff = Utils.create('p', {
                    textContent: `That means you tied with the Bot! Not bad!`
                })
            } else {        // bot did better
                guessDiff = Utils.create('p', {
                    textContent: `That means you guessed ${this.gameState.nGuesses - this.gameState.mgr.bot.nGuesses} more than the Bot! Better luck next time!`
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
                textContent: this.gameState.finished ? this.gameState.getWord() : 'Looks like we got ourselves a cheater!',
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
                this.gameState.resetGameState();
            }
        }));

        // append btndiv to list
        elems.push(btndiv);

        // push everything to the body
        body.append(...elems);
    }

    /*** PRIVATE HELPERS ***/
    #createSetting(name, desc, type, value) {
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
                    if (this.gameState) {
                        // update word length. this also updates the game word list & grid.
                        this.gameState.setWordLength(+btn.value);
    
                        // restart game
                        this.gameState.resetGameState();
                    }
                }).bind(this),
            })

            inputDiv.append(btn);
        }
        div = Utils.create('div', {className: 'settings-block',})

        // create the div of the whole settings block
        div.append(settingText, inputDiv);
        return div;
    }

    // helper function to aid in creating each of the stats
    #createStat(idx, label, stats) {
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
    #buildStats(stats) {
        let div = Utils.create('div', { className: "stats" })

        div.append(this.#createStat('played', 'Games Played', stats));
        div.append(this.#createStat('correct', 'Games Correct', stats));
        div.append(this.#createStat('correctperc', 'Correct %', stats));
        div.append(this.#createStat('won', 'Games Won', stats));
        div.append(this.#createStat('winperc', 'Win %', stats));
        div.append(this.#createStat('currentStreak', 'Current Streak', stats));
        div.append(this.#createStat('maxStreak', 'Max Streak', stats));

        return div;
    }

}