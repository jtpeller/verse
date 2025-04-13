// =================================================================
// = stats.js
// =  Description   : Implements Stats class for Verse! game
// =  Author        : jtpeller
// =  Date          : 2025.01.09
// =================================================================
'use strict';

class Stats {
    constructor(debug = false) {
        // provided prompts
        this.DEBUG = debug;

        // create stats object
        this.stats = {
            played: 0,          // games played
            correct: 0,         // word gotten correct
            correctperc: 0,     // percent correct (correct/played)
            won: 0,             // beat the bot
            winperc: 0,         // percent won (won/played)
            currentStreak: 0,   // streak of beating the bot
            maxStreak: 0,       // highest streak this session
        }
    }

    /** 
     * addPlay() - increments # games played
     */
    addPlay() {
        this.stats.played++;
    }

    /**
     * addCorrect() - add to correct-related fields
     * @param {boolean} correct     | whether entity is correct
     */
    addCorrect(correct) {
        // entity is correct?
        if (correct) {
            // increment correct
            this.stats.correct++;
        }

        // update correct percentage
        this.stats.correctperc = this.#divide(this.stats.correct, this.stats.played);
    }

    /**
     * addWin() - add to win-related fields
     * @param {boolean} win         | whether entity beat opponent
     */
    addWin(win) {
        // handle a winner
        if (win) {
            // increment won, streak
            this.stats.won++;
            this.stats.currentStreak++;

            // update max streak if necessary
            if (this.stats.currentStreak > this.stats.maxStreak) {
                this.stats.maxStreak = this.stats.currentStreak;
            }

        } else {
            // this entity lost, reset streak
            this.stats.currentStreak = 0;
        }

        // update win percentage
        this.stats.winperc = this.#divide(this.stats.won, this.stats.played);
    }

    getStats() {
        return this.stats;
    }

    // helper to properly handle div by zero.
    #divide(num, denom) {
        if (denom == 0) {
            return num;
        }
        return num / denom
    }
}