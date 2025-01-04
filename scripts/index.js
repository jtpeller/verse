// =================================================================
// = index.js
// =  Description   : initializes index.html
// =  Author        : jtpeller
// =  Date          : 2025.01.03
// =================================================================
'use strict';

document.addEventListener("DOMContentLoaded", function () {
    // list of links used for the navbar and homepage
    let ll = [
        {
            href: 'game.html',
            text: 'Play'
        },
        {
            href: 'game.html?help=1',
            text: 'Play with Hints'
        },
        {
            href: 'solver.html',
            text: 'Solver'
        },
        {
            href: 'bot-tester.html',
            text: 'Bot Tester'
        }
    ];

    const utils = new Utils();
    let loc = utils.select('#btn-loc')

    for (let i = 0; i < ll.length; i++) {
        let col = utils.create('div', {classList: `col-12 link-list level-${i}`})
        let abtn = utils.create('a', {
            classList: 'btn btn-item w-50',
            href: ll[i].href,
        })
        abtn.append(utils.create('a', {
            classList: 'btn-link',
            href: ll[i].href,
            href: ll[i].href,
            textContent: ll[i].text,
        }))
        col.append(abtn);
        loc.append(col);
    }
})
