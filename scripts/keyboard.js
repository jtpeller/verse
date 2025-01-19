// =================================================================
// = grid.js
// =  Description   : Implements Keyboard class for Verse! game
// =  Author        : jtpeller
// =  Date          : 2025.01.16
// =================================================================
'use strict';

class Keyboard {
    // creates the game's keyboard at the bottom of the page and the subsequent behaviors
    constructor(loc, classes) {
        // define attributes
        this.element = document.querySelector(loc);
        this.classes = classes;
        this.util = new Utils();
        this.enabled = true;

        // build the keyboard
        this.#build();
    }

    // builds the keyboard in this.element.
    #build() {
        const vals = ['qwertyuiop', 'asdfghjkl', '&zxcvbnm*']

        // for each row
        for (const val of vals) {
            // create the row
            var row_elem = this.util.create('div', { className: 'keyboard-row' })

            // for each char in val
            for (let i = 0; i < val.length; i++) {
                var txt = val[i];
                var key = val[i];

                // handle the special characters. & = Enter, * = BKSP
                if (txt === '&') {
                    txt = "ENTER";
                    key = "Enter";
                } else if (val[i] === '*') {
                    txt = "←";
                    key = "Backspace";
                }

                var button = this.util.create('button', {
                    className: 'key',
                    textContent: txt.toUpperCase(),
                    id: `key-${txt.toUpperCase()}`,
                    value: key,
                })

                button.onclick = ((e) => {
                    if (this.enabled) {       // only dispatch if keyboard is enabled
                        const btn = e.target;
                        const val = btn.getAttribute('value');
    
                        document.dispatchEvent(new KeyboardEvent(
                            'keydown', { 'key': val }
                        ))

                        console.log("keypress: ", val);
                    }
                }).bind(this);

                row_elem.append(button);
            }

            // append the row to the keyboard
            this.element.append(row_elem);
        }
    }

    /** classify key under certain rules: correct > incorrect > not present */
    classifyKey(key, class_name, priority) {
        let classes = key.classList;    // get current classes
        let arr = Array.from(classes);

        // check if the key is not classed
        if (classes.length <= 1) {
            // just assign provided class
            key.classList.add(class_name);
            return;
        }

        // now, check class priority
        if (priority == 2) {
            // always overwrite current to priority 2
            key.classList.add(class_name);
        } else if (priority == 1 && !arr.includes(this.classes[2])) {
            // only assign if current class is lower priority
            key.classList.add(class_name);
        } else {    // current class will be higher priority
            return;
        }
    }

    // returns keyboard to original state / coloring.
    reset() {
        // loop through each of the classes
        for (var i = 0; i < this.classes.length; i++) {
            // extract all keys with that class
            var list = this.element.querySelectorAll('.'+this.classes[i]);
            var arr = [...list];

            // loop only through those keys for speed & remove class
            arr.forEach(key => {
                key.classList.remove(this.classes[i]);
            });
        }
    }

    // enables caller to enable or disable the keyboard.
    setEnabled(enabled) {
        // enabled can only be a Boolean
        if (enabled === true || enabled === false) {
            this.enabled = enabled;
        }
    }
}