// =================================================================
// = tester.js
// =  Description   : Performs tests for bot-tester.html
// =  Author        : jtpeller
// =  Date          : 2025.01.03
// =================================================================
"use strict";

document.addEventListener("DOMContentLoaded", () => {
    // globals & constants
    const BOTS = ["FRNG", "PRNG", "Eliminator", "Clique"];
    const correct_svgdiv = "#correct-svgdiv";
    const avg_svgdiv = "#avg-guesses-svgdiv";
    const SIM_SIZE = 1000;
    const M_GUESSES = 6;
    const LEN = 5;
    const MIN = 3;
    const UUID = Utils.create_UUID();
    const DEBUG = false;
    const DEV = false;

    // objects & non-consts
    let rate_obj = new Rate(undefined, UUID);
    let allWords = [];
    let words = "";

    // d3js values

    // props skeletons
    let props = {
        mode: 0,        // only thing to change!
        maxGuesses: M_GUESSES,
        rate: rate_obj,
        DEBUG: DEBUG,
    }

    let bot_props = {
        wordList: null,
        length: LEN,
        guesses: M_GUESSES,
        DEBUG: DEBUG,
    }

    // build SVG, which can be built regardless of word list!

    // ... define the data
    let correct = [
        { name: "Eliminator", value: 980 },
        { name: "Clique", value: 964 },
        { name: "PRNG", value: 958 },
        { name: "FRNG", value: 4 },
    ]

    let avg_guesses = [
        { name: "Eliminator", value: 3.965 },
        { name: "PRNG", value: 4.214 },
        { name: "Clique", value: 5.986 },
        { name: "FRNG", value: 5.987 },
    ]

    let wrong_words = [
        {
            name: "PRNG", value: [
                "BELLS",
                "BESTS",
                "FIXES",
                "FEARS",
                "SOBER",
                "LOVES",
                "BRINK",
                "DALES",
                "ROPES",
                "CREWS",
                "JEEPS",
                "DATER",
                "ROVES",
                "VALVE",
                "AXERS",
                "DOING",
                "HILTS",
                "HALTS",
                "NERVE",
                "LOSES",
                "CLASS",
                "PASTE",
                "RAWER",
                "HIKED",
                "FUZZY",
                "HOWLS",
                "TASTE",
                "RAVED",
                "BENDS",
                "JOKER",
                "STOVE",
                "VOWED",
                "PLOTS",
                "WEARS",
                "HAZES",
                "TUNER",
                "BOWLS",
                "EVOKE",
                "RARER",
                "HARMS",
                "SACKS",
                "BABES"
            ]
        },
        {
            name: "Eliminator", value: [
                "FADES",
                "EARED",
                "DINED",
                "ROVER",
                "DOZES",
                "SEEPS",
                "TASTE",
                "BAYED",
                "SHAPE",
                "PAVED",
                "SEEDS",
                "LIVES",
                "VOWED",
                "BAYED",
                "WEARS",
                "SINKS",
                "RARER",
                "HIRER",
                "BABES",
                "TEXTS"
            ]
        },
        {
            name: "Clique", value: [
                "BESTS",
                "ARSON",
                "SIREN",
                "CHILL",
                "EARED",
                "SPOOL",
                "RIDGE",
                "SLEET",
                "REVEL",
                "DROOL",
                "BULLS",
                "EDGED",
                "ODORS",
                "EGGED",
                "SEEPS",
                "ROUGE",
                "LEADS",
                "BULBS",
                "SLIME",
                "FLAIR",
                "SLIME",
                "TROTS",
                "BUSTS",
                "PEEPS",
                "SNOOP",
                "PLEAS",
                "SEEDS",
                "RISES",
                "SUITS",
                "SPOON",
                "ETHER",
                "SHEDS",
                "SLEET",
                "SONAR",
                "BULLS",
                "OPTIC"
            ]
        }
    ]

    // ... build charts
    buildSVG(correct_svgdiv, correct, "Games Correct", SIM_SIZE);
    buildSVG(avg_svgdiv, avg_guesses, "Average Guess Count", M_GUESSES);

    if (DEV) {
        // loader
        let loader = document.querySelector('#loader');
        loader.classList.add("visually-hidden")
    }

    // first, load in the words.
    Utils.promiseWords(wordsCallback)

    // =================================================================
    // =
    // = FUNCTIONS & LOGIC
    // =
    // =================================================================

    function wordsCallback(data) {
        // extract words
        for (let i = 0; i < data.length; i++) {
            // handle line endings because of course everything has to be complicated
            if (data[i].includes("\r\n")) {
                allWords.push(data[i].toUpperCase().split("\r\n"));
            } else {
                allWords.push(data[i].toUpperCase().split("\n"));
            }
        }
        words = allWords[LEN - MIN].slice();

        // update words based on selected words
        bot_props.wordList = words.slice();

        // add event listener to button now that words are read in
        if (DEV) {
            document.querySelector("#run-btn").addEventListener("click", runSimulation);
        }
    }


    // builds the SVG inside the elem referred to by id
    function buildSVG(id, chart_data, y, m) {
        let elem = Utils.select(id)

        if (!chart_data) {
            console.log("Data is empty, leaving");
            return
        }

        // build chart & append to elem
        let svg = d3.create("svg")
        buildChart(svg, chart_data, y, m)
        console.log(svg)
        elem.append(svg.node());

        function buildChart(svg, data, y_label, max) {
            // constant SVG values
            const margin = { top: 50, left: 200, bottom: 125, right: 50 };
            const width = 1000;
            const height = 600;

            // dimensions for inner chart (the g element)
            const innerWidth = width - margin.left - margin.right;
            const innerHeight = height - margin.top - margin.bottom;

            // ensure SVG is proper dims
            svg.attr("viewBox", `0 0 ${width} ${height}`)

            // set up x & y scale functions to transform data
            const x_scale = d3.scaleBand()
                .range([0, innerWidth])
                .domain(data.map(d => d.name))
                .padding(0.25);

            const y_scale = d3.scaleLinear()
                .domain([0, max])
                .range([innerHeight, 0]);

            // set up bar chart thingy
            const g = svg.append("g")
                .attr("transform", `translate(${margin.left}, ${margin.top})`)
                .attr("id", "g-bar");

            g.selectAll("rect")
                .data(data)
                .join("rect")
                .classed("bar", true)
                .attr("x", d => x_scale(d.name))
                .attr("y", y_scale(0))
                .attr("width", x_scale.bandwidth())
                .transition().duration(750)
                .attr("height", innerHeight - y_scale(0))

            svg.selectAll("rect")
                .transition()
                .duration(750)
                .attr("y", d => y_scale(d.value))
                .attr("height", d => innerHeight - y_scale(d.value))
                .delay((d, i) => i * 100)

            // add bar labels
            g.selectAll(".text")
                .data(data)
                .join("text")
                .classed("bar-label", true)
                .attr("x", (d) => x_scale(d.name))
                .attr("y", (d) => y_scale(d.value))
                .attr("dx", x_scale.bandwidth() / 2)
                .attr("dy", "-15px")
                .attr("dominant-baseline", "middle")
                .attr("opacity", 0)
                .transition()
                .delay(750)
                .duration(750)
                .attr("opacity", 1)
                .text((d) => d.value);

            let xgen = d3.axisBottom(x_scale);

            // add x & y axes
            g.append("g")
                .attr("transform", `translate(0, ${innerHeight})`)
                .call(xgen)
                .selectAll("text")
                .style("text-anchor", "end")
                .attr("transform", "rotate(-25)")

            g.append("g")
                .attr("transform", `translate(0, 0)`)
                .call(d3.axisLeft(y_scale));

            // add axes labels
            svg.append("text")
                .attr("class", "y-axis-label")
                .attr("dominant-baseline", "middle")
                .attr("dx", -height / 2 + 35)
                .attr("dy", margin.left / 2)
                .text(y_label)
        }
    }

    // runs simulation of 1000 words per bot in BOTS
    function runSimulation() {
        // generate the list of words to use
        let solutions = [];
        for (let i = 0; i < SIM_SIZE; i++) {
            solutions.push(words[Utils.rng(words.length)])
        }

        // generate all bots to use
        let mgrs = [];
        for (let i = 0; i < BOTS.length; i++) {
            props.mode = i;
            mgrs.push(new Manager(props, bot_props));
        }

        // metrics for simulation
        let correct = Array(BOTS.length).fill(0);
        let num_guesses = Array.from({ length: BOTS.length }, () => new Array(0).fill(0));
        let wrong_words = Array.from({ length: BOTS.length }, () => new Array(0).fill(0));

        // loop through the selected solutions
        for (let i = 0; i < solutions.length; i++) {
            var word = solutions[i];
            rate_obj.setWord(word, UUID);

            if (DEBUG) {
                console.log("WORD", word)
            }

            // loop through each bot, run it on this word.
            for (let m_idx = 0; m_idx < mgrs.length; m_idx++) {
                let mgr = mgrs[m_idx]

                // play the game
                mgr.reset();

                // record results
                num_guesses[m_idx].push(mgr.getGuessCount());
                if (mgr.bot.correct) {
                    correct[m_idx]++;
                } else {
                    wrong_words[m_idx].push(word);
                }
            }

            // record progress in console.
            console.log("word num:", i + 1)
        }

        // average the number of guesses
        let avg_guesses = Array(num_guesses.length).fill(0);
        const average = array => array.reduce((a, b) => a + b) / array.length;
        for (let i = 0; i < num_guesses.length; i++) {
            avg_guesses[i] = average(num_guesses[i]);
        }

        // log results
        console.log("Correct:", correct)
        console.log("Avg guesses:", avg_guesses)
        console.log("wrong_words:", wrong_words)
    }
});
