// =================================================================
// = grid.js
// =  Description   : Implements Grid class for Verse! game
// =  Author        : jtpeller
// =  Date          : 2025.01.09
// =================================================================
'use strict';

class Grid {
    /**
     * Grid handles all logic & things related to the game grid.
     * Handles formatting, setting grid values, etc.
     */
    constructor(rowCount, colCount, classes, loc = '#grid') {
        // extract attributes from provided info
        this.grid = document.querySelector(loc);
        if (!this.grid) {
            throw new Error(`Grid location does not exist.`)
        }
        this.rows = rowCount;
        this.cols = colCount;
        this.classes = classes;
       
        // attributes
        this.activeRow = 0;     // which row is being worked on.
        this.util = new Utils();
        
        // build immediately upon instantiation.
        this.buildGrid();
    }

    /**
     * buildGrid() -- responsible for building the grid
     */
    buildGrid() {
        // grid must be clear
        this.grid.innerHTML = '';       // clear grid.

        // for row count:
        for (let i = 0; i < this.rows; i++) {
            this.grid.append(this.createRow(i));
        }
    }
    
    /**
     * createRow() -- creates a game row thingy
     * @param {int} i | which row this is
     * @param {string} [prefix='']  | prefix for row ID
     * @param {string} [value='']   | value for the row to take on (i.e., a user's/bot's guess)
     */
    createRow(i, prefix = '', rating = [], value = '') {
        var row = this.util.create('div', { 
            className: "game-row",
            style: `grid-template-columns: repeat(${this.cols}, 0fr);`,
            id: `${prefix}row-${i}` 
        })

        // for the word length
        for (let j = 0; j < this.cols; j++) {
            // for use when caller wants to define a rated row
            var cellClass = 'game-cell';
            if (rating != []) {
                cellClass += ' ' + this.classes[rating[j]]
            }

            // create a cell per row
            row.append(this.util.create('div', { 
                className: cellClass,
                id: `cell-${j}`,
                textContent: value[j],
            }));
        }

        return row;
    }

    /** highlights the provided row, as indication of which guess we're on */
    highlightRow(rownum) {
        if (rownum < 0 || rownum >= this.rows) {
            return;
        }

        // loop through all others and remove highlighted
        this.activeRow = rownum;
        for (let i = 0; i < this.rows; i++) {
            document.querySelector(`#row-${i}`).classList.remove('highlighted');
        }
        document.querySelector(`#row-${rownum}`).classList.add('highlighted');
    }

    /**
     * getCellValue() - helper function to get value of the row x cell
     * @param row {Number}      which row to select
     * @param cell {Number}     which cell of the row to select
     * @returns {String}        the text inside the cell
     */
    getCellValue(row, cell) {
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
    getCell(row, cell) {
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
    setCell(row, cell, value) {
        var row = document.querySelector(`#row-${row}`);
        var cell = row.querySelector(`#cell-${cell}`);
        cell.textContent = value;
        cell.classList.add('animated-cell');

        setTimeout(() => {
            cell.classList.remove('animated-cell');
        }, 400);   // after a bit, remove the class
    }

    /**
     * setRowsCols() - sets the number of rows for the grid (triggers rebuild)
     */
    setRowsCols(rows, cols) {
        if (rows >= 1 && cols >= 1) {
            this.rows = rows;
            this.cols = cols;
            this.buildGrid();
            this.highlightRow(0);   // highlight first row
        } else if (this.DEBUG) {
            this.util.log(rows, "Rows:");
            this.util.log(cols, "Cols:");
        }
    }

    /**
     * resetGrid() - clears contents & classes of the grid.
     */
    resetGrid() {
        for (var i = 0; i < this.rows; i++) {
            for (var j = 0; j < this.cols; j++) {
                // empty cells
                this.setCell(i, j, '');

                // remove classes
                this.getCell(i, j).classList.remove(...this.classes);
            }
        }
    }
}