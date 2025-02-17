// =================================================================
// = solver.js
// =  Description   : Functionality behind solver.html
// =  Author        : jtpeller
// =  Date          : 2025.01.03
// =================================================================
'use strict';

// TODO: fix restart
// TODO: fix settings
// TODO: once a cell is marked complete + submit, it should stay that value/class to make things easier?

/**
 * event listener to populate the page.
 */
document.addEventListener('DOMContentLoaded', function () {
    // constants
    const WID = '#words';         // ID for words
    const MIN = 3;                // minimum length
    const MAX = 12;               // maximum length
    const ROW_COUNT = 6;          // default row count
    const CLASSES = ['incorrect', 'present', 'correct'];
    const TOAST_ID = "toast-msg";
    const DEBUG = false;
    
    // useful values
    let allWords = [];
    let words = [];
    let LEN = 5;            // default word length
    let curr_row = 0;       // active row
    let letter = 0;         // which letter of the word is active.

    // select elements
    let wdiv = document.querySelector(WID);

    // grid object
    let grid = new Grid();
    grid.buildGrid(6, LEN, CLASSES, '#grid')
    grid.highlightRow(curr_row)

    // build the keyboard
    let keyboard = new Keyboard('#keyboard', CLASSES);

    // bot to handle guesses and whatnot
    let bot = null; 

    // modal for helpers
    let solverState = {
        resetGameState: () => {
            grid.resetGrid();
            words = structuredClone(allWords[LEN-MIN])
            addWords();
        }
    }
    let modal = new Modal('#modal');

    // enable grid toggling
    initLetterGrid();

    // enable tooltips everywhere 
    // ref: https://getbootstrap.com/docs/5.3/components/tooltips/#enable-tooltips
    const tooltipTriggerList = document.querySelectorAll('[data-bs-toggle="tooltip"]')
    const tooltipList = [...tooltipTriggerList].map(tooltipTriggerEl => new bootstrap.Tooltip(tooltipTriggerEl))
    
    
    // next, append word list for default len
    Utils.promiseWords(wordsCallback);

    // =================================================================
    // =
    // = FUNCTIONS & LOGIC
    // =
    // =================================================================

    // This enables the grid's click-to-change-cell-class functionality
    function initLetterGrid(elem) {
        // loop through each row
        for (let row = 0; row < ROW_COUNT; row++) {
            let row_elem = document.querySelector(`#row-${row}`)
            for (let idx = 0; idx < LEN; idx++) {
                // create the cell element
                let cell = row_elem.querySelector(`#cell-${idx}`)
    
                // add the listener to the cell. this will toggle between the different classes
                cell.addEventListener('click', function(e) {
                    var tgt = e.target;
                    let list = tgt.classList
                    if (list.contains('incorrect')) {
                        list.toggle('incorrect')
                        list.toggle('present')
                    } else if (list.contains('present')) {
                        list.toggle('present')
                        list.toggle('correct')
                    } else if (list.contains('correct')) {
                        list.toggle('correct')
                    } else {
                        list.toggle('incorrect')
                    }

                    // once toggled, you must update the wordlist!
                })
            }    
        }
    }

    // what to call after reading in the words
    function wordsCallback(data) {
        // extract data
        for (let i = 0; i < data.length; i++) {
            // line endings
            if (data[i].includes("\r\n")) {
                allWords.push(data[i].toUpperCase().split("\r\n"));
            } else {
                allWords.push(data[i].toUpperCase().split("\n"));
            }
        }
        
        // after leaving the loop, select the default
        words = structuredClone(allWords[LEN - MIN]);

        // instantiate bot
        bot = new Bot({
            wordList: structuredClone(words),
            length: LEN,
            guesses: ROW_COUNT,
            DEBUG: DEBUG,
        })

        // create keyboard listener
        document.addEventListener('keydown', (e) => handleInput(e));


        // add words to the page
        addWords();        
    }

    function addWords() {
        wdiv.innerHTML = '';
        for (let i = 0; i < words.length; i++) {
            wdiv.append(Utils.create('div', {
                className: 'col-3 word',
                textContent: words[i],
            }))
        }
    }

    function updateWords() {
        words = bot.wordList
        wdiv.innerHTML = '';
        addWords()
    }

    function handleInput(e) {
        // if game is already complete, do nothing
        if (curr_row > 5) {
            return;
        }

        // handle backspace or delete
        if (e.key === "Backspace" || e.key === "Delete") {
            e.preventDefault();

            // check boundaries (i.e., this.letter is <= 0, do nothing)
            if (letter > 0) {
                // move letter to previous cell
                letter--;
                grid.setCell(curr_row, letter, '');
            }
        } else if (e.key === "Enter") {
            e.preventDefault();
            handleSubmit();
        } else if (letter < LEN && /^[a-z]$/i.test(e.key)) {
            grid.setCell(curr_row, letter, e.key.toUpperCase());
            letter++;
        } else {
            // buffer is full, do nothing
        }
    }

    /**
     * handleSubmit() - Handles when user submits a guess
     * This will:
     *  - Check if the user put all the ratings in. If not, issue toast
     *  - Check if guess is full. If not, toast.
     *  - If OK, this callback will:
     *      - update bot's regex
     *      - update word list
     *      - add new word list to the page
     */
    function handleSubmit(e) {
        if (letter == LEN) {
            // extract rating from game-board
            let rating = getRowRating(curr_row);
            
            // verify ratings exist
            if (rating.includes(-1)) {
                issueToast("Guess must be rated!")
                return;
            }

            // extract guess from game-board
            let guess = '';
            for (let i = 0; i < LEN; i++) {
                guess += grid.getCellValue(curr_row, i);
            }

            // update word list
            bot.update(guess, rating)
            updateWords(bot.wordList)

            // move to next row
            curr_row++;
            letter = 0;     // reset to first letter

            // highlight next row
            grid.highlightRow(curr_row)
        } else {        // guess isn't long enough, show msg
            issueToast("Guess is incomplete!");
        }
    }

    function getRowRating(rownum) {
        let rating = Array(LEN).fill(-1);
        for (let i = 0; i < LEN; i++) {
            var cell = grid.getCell(curr_row, i)
            
            // loop through classes
            for (let j = 0; j < CLASSES.length; j++) {
                if (cell.classList.contains(CLASSES[j])) {
                    rating[i] = j
                }
            }
        }
        return rating
    }

    function issueToast(msg) {
        const toast = bootstrap.Toast.getOrCreateInstance(document.getElementById(TOAST_ID));
        document.querySelector('.toast-body').textContent = msg;   // update msg
        toast.show();       // show the toast
    }
});