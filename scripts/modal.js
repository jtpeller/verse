// =================================================================
// = grid.js
// =  Description   : Implements Modal class for Verse! game
// =  Author        : jtpeller
// =  Date          : 2025.01.09
// =================================================================
'use strict';

class Modal {
    constructor(loc, modal_funcs) {
        this.loc = loc;

        this.modal = document.querySelector(loc);
        if (!this.modal) {
            throw new Error('Modal location does not exist.')
        }

        // extract provided attributes
        this.funcs = modal_funcs;

        // ... flags for checking whether the selected modal is built.
        this.helpBuilt = false;
        this.helpHTML = '';
        
        // create the event listener for the modal
        this.modal.addEventListener('show.bs.modal', ((event) => {
            // figure out which modal to populate
            const val = +(event.relatedTarget.getAttribute('value'));
    
            // set the title of the modal
            modal.querySelector('#modal-title').innerHTML = '';//type;
    
            // set body of modal to return of the function
            const modal_body = modal.querySelector('#modal-body');
            modal_body.innerHTML = '';
            modal_body.append(this.funcs[val]());

        }).bind(this));
    }
}