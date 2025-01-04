// =================================================================
// = common.js
// =  Description   : Implements common utilities
// =  Author        : jtpeller
// =  Date          : 2025.01.03
// =================================================================
'use strict';

class Utils {
    /**
     * append() - wrapper for Element.appendChild()
     * @param {Element} appendee    which element to append to
     * @param {string} elem         what type of Element to create
     * @param {object} options      properties to assign to elem
     * @return {Element}
     */
    append(appendee, elem, options={}) {
        return appendee.appendChild(this.create(elem, options));
    }
    
    /**
     * create() -- wrapper for Object.assign(document.createElement(), options)
     * @param {string} elem     the type of HTML element to make
     * @param {object} options  what properties to assign to it
     * @returns {Element}
     */
    create(elem, options={}) {
        return Object.assign(document.createElement(elem), options)
    }

    /**
     * select() is a wrapper for querySelector (makes it look more JQuery-ish)
     * @param {string} val      what to select (e.g., an id: "#element-id" or a class ".element-class")
     * @param {Element} origin  source Element to select from (default: document)
     * @returns {Element}
     */
    select(val, origin=document) {
        return origin.querySelector(val);
    }
}