// =================================================================
// = solver.js
// =  Description   : Functionality behind solver.html
// =  Author        : jtpeller
// =  Date          : 2025.01.03
// =================================================================
'use strict';

// TODO: implement means of selecting other word lengths
// TODO: implement clear row
// TODO: implement listener to update list
// TODO: make the grid clickable, focusable, text, etc.

/**
 * event listener to populate the page.
 */
document.addEventListener('DOMContentLoaded', function () {
    // constants
    let CID = '#correct';       // ID for row 1
    let PID = '#present';       // ID for row 2
    let NID = '#incorrect';     // ID for row 3
    let WID = '#words';         // ID for words
    let DEBUG = false;          // verbosity
    let MIN = 3;                // minimum length
    let MAX = 12;               // maximum length
    let CPN = ['incorrect', 'present', 'correct'];
    let COL = 10;               // minimum cols len for grid rows
    
    // useful values
    let util = new Utils(DEBUG);
    let allWords = [];
    let words = [];
    let len = 5;                // default word length

    // select elements
    let wdiv = document.querySelector(WID);

    // create the grids for each row
    let grid = Grid.ManualGrid(CPN);
    grid.cols = 10;
    let crow = grid.createRow(2, '', Array(10).fill(2));
    let prow = grid.createRow(1, '', Array(10).fill(1));
    let nrow = grid.createRow(0, '', Array(10).fill(0));

    // insert the rows
    document.querySelector(CID).append(crow);
    document.querySelector(PID).append(prow);
    document.querySelector(NID).append(nrow);

    // next, append word list for default len
    util.promiseWords(wordsCallback);

    // =================================================================
    // =
    // = FUNCTIONS & LOGIC
    // =
    // =================================================================

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
        words = allWords[len - MIN];

        // add words to the page
        addWords();
        //wdiv.innerHTML = words.join("<br>");
    }

    function addWords() {
        for (let i = 0; i < words.length; i++) {
            wdiv.append(util.create('div', {
                className: 'col-3 word',
                textContent: words[i],
            }))
        }
    }
});