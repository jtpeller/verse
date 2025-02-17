// =================================================================
// = utils.js
// =  Description   : Implements Utils class
// =  Author        : jtpeller
// =  Date          : 2025.01.03
// =================================================================
'use strict';

class Utils {
    constructor(debug = false) {
        this.DEBUG = debug;
    }

    /**
     * append() - wrapper for Element.appendChild()
     * @param {Element} appendee    which element to append to
     * @param {string} elem         what type of Element to create
     * @param {object} options      properties to assign to elem
     * @return {Element}
     */
    static append(appendee, elem, options={}) {
        return appendee.appendChild(this.create(elem, options));
    }
    
    /**
     * create() -- wrapper for Object.assign(document.createElement(), options)
     * @param {string} elem     the type of HTML element to make
     * @param {object} options  what properties to assign to it
     * @returns {Element}
     */
    static create(elem, options={}) {
        return Object.assign(document.createElement(elem), options)
    }

    /**
     * create_UUID() -- generate a cryptographic UUID
     */
    static create_UUID() {
        return window.crypto.randomUUID();
    }

    static log(value, name="") {
        if (this.DEBUG) {
            console.log(name, JSON.parse(JSON.stringify(value)));
        }
    }

    /**
     * rng() generates a random number between 0 and max.
     * @param {Number} max      what to select (e.g., an id: "#element-id" or a class ".element-class")
     * @returns {Number}        randomly generated value in [0, max]
     */
    static rng(max) {
        return Math.floor(Math.random() * max);
    }

    /**
     * select() is a wrapper for querySelector (makes it look more JQuery-ish)
     * @param {string} val      what to select (e.g., an id: "#element-id" or a class ".element-class")
     * @param {Element} origin  source Element to select from (default: document)
     * @returns {Element}
     */
    static select(val, origin=document) {
        return origin.querySelector(val);
    }

    /**
     * promiseWords() -- reads the words in, then callback provided by the caller.
     */
    static promiseWords(callback) {
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
        }).then((data) => {
            callback(data);
        });
    }
}