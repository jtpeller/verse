// =================================================================
// = solver.js
// =  Description   : Functionality behind solver.html
// =  Author        : jtpeller
// =  Date          : 2025.01.03
// =================================================================
'use strict';

// TODO: fix restart
// TODO: fix settings
// TODO: maybe once a cell is marked complete + submit, it should stay that value/class to make things easier?

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
    let help_html = '';

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
        wordLength: LEN,
    }

    let modal_funcs = [help, restart, settings];
    let modal = new Modal('#modal', modal_funcs);

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

    // modal stuff

    // builds the help modal
    function help() {
        //// we can speed this up with flags.
        if (help_html != '') {
            let body = Utils.create('div', {})
            body.innerHTML = help_html;
            return body;
        }

        // title 
        const title = Utils.create('h1', {
            className: 'modal-h1',
            textContent: 'How To Use',
        });

        // overview
        const text = "In a pinch? On the last guess and you desperately need to preserve your streak? Fear not! This solver can help!"
        let header1 = Utils.create('h2', { classList: "modal-h2", textContent: "Overview" })
        let p = Utils.create('p', { textContent: text })
        
        // details
        let header2 = Utils.create('h2', { classList: "modal-h2", textContent: "Steps" })
        let steps = [
            "Type out your guess in the game grid below.",
            "Mark cells as incorrect (once), present (twice), or correct (thrice) by clicking on them!",
            "Submit your guess by pressing ENTER",
            "The word list at the bottom will update to narrow down your guess!",
        ]

        // build the details OL
        let ol = Utils.create('ol', {
            classList: "list-group list-group-numbered"
        })
        for (let i = 0; i < steps.length; i++) {
            var li = Utils.create('li', {
                classList: "list-group-item bg-dark",
                textContent: steps[i]
            })
            ol.append(li)
        }

        // append to body
        let body = Utils.create('div', {})
        body.append(title)
        body.append(header1);
        body.append(p);
        body.append(header2);
        body.append(ol);

        help_html = body.innerHTML;

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
                closeModal();
            }
        });

        var restart = Utils.create('button', {
            className: "btn btn-danger w-100 m-1",
            innerText: "Restart",
            onclick: ((e) => {
                closeModal();
                restartSolver();
            })
        })

        // add these buttons to the div
        div.append(cancel);
        div.append(restart);

        // add div to elems
        elems.push(div);

        // add the div to the body
        let body = Utils.create('div', {})
        body.append(...elems);
        return body;
    }

    // builds the settings modal
    function settings() {
        let elems = [];

        elems.push(Utils.create('h1', {
            className: 'modal-h1',
            textContent: 'Settings',
        }))

        // create the settings
        elems.push(
            createSetting('Word Length', 'Press one of these buttons to change the length of the word to guess!', [3, LEN, 12]),
        );

        // append to body
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
                onclick: (e) => { 
                    // determine which button was pressed and update.
                    var btn = e.target;

                    // remove old button color
                    var prev_btn = document.querySelector('.btn-grid').querySelector('.btn-primary')
                    prev_btn.classList.remove('btn-primary');
                    prev_btn.classList.add('btn-dark');
                    
                    // update button color
                    btn.classList.remove('btn-dark');
                    btn.classList.add('btn-primary');

                    // update word length, words, and grid
                    LEN = +btn.value;
                    words = structuredClone(allWords[LEN-MIN])
                    grid.setRowsCols(ROW_COUNT, LEN)
    
                    // restart
                    restartSolver();
                }
            })

            inputDiv.append(btn);
        }
        div = Utils.create('div', {className: 'settings-block',})

        // create the div of the whole settings block
        div.append(settingText, inputDiv);
        return div;
    }

    function closeModal() {
        document.querySelector('#modal-close-btn').click();
    }

    function restartSolver() {
        grid.resetGrid();
        words = structuredClone(allWords[LEN-MIN])
        addWords();
    }

});