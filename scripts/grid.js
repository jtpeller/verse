// =================================================================
// = grid.js
// =  Description   : Implements Grid class for Verse! game
// =  Author        : jtpeller
// =  Date          : 2025.01.09
// =================================================================
'use strict';

/**
 * Grid handles all logic & things related to the game grid.
 * Handles formatting, setting grid values, etc.
 */
class Grid {
    // grid needs to know which classes will be used.
    constructor(classes) {
        this.classes = classes;
    }

    /**
     * buildGrid() -- responsible for building the grid and initializing values
     *  Build Grid would be used when caller wants a simple grid created for them.
     *  Grid attributes will be created and managed by the grid
     *  
     *  If caller wants to manage their own grid, they can utilize the creator
     *      functions: createRow, createCell. They can manage rows / cols counts
     *      if desired, but it wouldn't be necessary there.
     */
    buildGrid(rows, cols, classes, loc = '#grid') {
        this.rows = rows;
        this.cols = cols;
        this.classes = classes;

        // extract attributes from provided info
        this.grid = document.querySelector(loc);
        if (!this.grid) {
            throw new Error(`Grid location does not exist.`)
        }
        
        // grid must be clear
        this.grid.innerHTML = '';       // clear grid.
       
        // attributes
        this.activeRow = 0;     // which row is being worked on.

        // for row count:
        for (let i = 0; i < this.rows; i++) {
            this.grid.append(this.createRow(i));
        }
    }
    
    /**
     * createRow() -- creates a game row thingy
     * @param {int} i               // which row this is
     * @param {string} [prefix='']  // prefix for row ID
     * @param {string} [value='']   // value for the row to take on (i.e., a user's/bot's guess)
     */
    createRow(i, prefix = '', rating = [], value = '') {
        var row = Utils.create('div', { 
            className: "game-row",
            style: `grid-template-columns: repeat(${this.cols}, 0fr);`,
            id: `${prefix}row-${i}` 
        })

        // for the word length
        for (let j = 0; j < this.cols; j++) {
            row.append(this.createCell(j, rating[j], value[j]))
        }

        return row;
    }

    // creates a single cell, with provided value, rating, etc.
    createCell(j, rating = -1, value = '') {
        // for use when caller wants to define a rated row
        var cellClass = 'game-cell';
        if (rating != [] && rating >= 0 && rating <= 2) {
            cellClass += ' ' + this.classes[rating]
        }

        let cell = Utils.create('div', { 
            className: cellClass,
            id: `cell-${j}`,
            textContent: value,
        })

        return cell;
    }

    /** highlights the provided row, as indication of which guess we're on */
    highlightRow(rownum) {
        if (rownum < 0 || rownum >= this.rows) {
            return;
        }

        console.log(this.rows);

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
            this.buildGrid(this.rows, this.cols, this.classes, this.loc);
            this.highlightRow(0);   // highlight first row
        } else if (this.DEBUG) {
            Utils.log(rows, "Rows:");
            Utils.log(cols, "Cols:");
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