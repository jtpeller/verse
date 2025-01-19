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
    let modal = new Modal(MODAL_LOC, gameState);

    // initialize the words (which starts the game)
    initWords();

    // =================================================================
    // =
    // = FUNCTIONS & GAME LOGIC
    // =
    // =================================================================

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
                    gameState.allWords.push(data[i].toUpperCase().split("\r\n"));
                } else {
                    gameState.allWords.push(data[i].toUpperCase().split("\n"));
                }
            }
            
            // call startGame now
            startGame();
        })
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
});

