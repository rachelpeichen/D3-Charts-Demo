const width = 820;
const height = 820;
const radarWidth = 600;
const radarHeight = 600;

// set the dimensions and margins of lollipop graph
const lollipopMargin = { top: 20, right: 20, bottom: 100, left: 35 };
const lollipopWidth = 480 - lollipopMargin.left - lollipopMargin.right;
const lollipopHeight = 600 - lollipopMargin.top - lollipopMargin.bottom;

const margin = {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
};
const scatterMargin = 50;
const color = d3.scaleOrdinal(d3.schemeCategory10);
const radarFeatures = [
    "danceability",
    "instrumentalness",
    "speechiness",
    "acousticness",
    "energy",
    "liveness",
];

// Helper
function compareNumbers(a, b) {
    return b - a;
}

const createGenresCheckboxes = (genresArr) => {
    // create a div
    genresArr.forEach((g) => {
        let div = document.createElement("div");
        div.setAttribute("class", "form-check form-check-inline");

        // create a checkbox
        let checkbox = document.createElement("input");
        checkbox.setAttribute("class", "form-check-input");
        checkbox.setAttribute("type", "checkbox");
        checkbox.setAttribute("id", g);
        checkbox.setAttribute("value", g);
        // create a label
        let label = document.createElement("label");
        label.setAttribute("class", "form-check-label");
        label.setAttribute("for", g);
        label.innerText = g;

        // add the checkbox and label to the div
        div.appendChild(checkbox);
        div.appendChild(label);

        // append the div to the container div
        document.getElementById("genres-container").appendChild(div);
    });
};

d3.csv("MixedChartsData.csv").then((tmpRawDataArray) => {
    renderAveragePopularityTable(tmpRawDataArray);

    let allGenresSet = new Set();
    tmpRawDataArray.forEach((t) => {
        allGenresSet.add(t.track_genre);
    });
    const allGenresArr = Array.from(allGenresSet);
    createGenresCheckboxes(allGenresArr);

    const rawDataArray = tmpRawDataArray.filter(
        (t) => parseInt(t.popularity) >= 90
    );
    let artistsSet = new Set();
    let genreSet = new Set();
    let graph = { nodes: [], links: [] };

    rawDataArray.forEach((r) => {
        artistsSet.add(r.artists);
        genreSet.add(r.track_genre);
    });

    let uniqueArtistArr = Array.from(artistsSet);
    let uniqueGenreArr = Array.from(genreSet);

    uniqueArtistArr.forEach((g) => {
        graph.nodes.push({ id: g, artistName: g, nodeType: "artist" });
    });

    uniqueGenreArr.forEach((g) => {
        graph.nodes.push({ id: g, genreName: g, nodeType: "genre" });
    });

    rawDataArray.forEach((r) => {
        graph.nodes.push({
            id: r.track_id,
            trackName: r.track_name,
            genre: r.track_genre,
            artistName: r.artists,
            nodeType: "track",
            danceability: r.danceability,
            energy: r.energy,
            speechiness: r.speechiness,
            acousticness: r.acousticness,
            instrumentalness: r.instrumentalness,
            liveness: r.liveness,
            album: r.album_name,
            popularity: r.popularity,
        });
        graph.links.push({ source: r.track_id, target: r.artists });
        graph.links.push({ source: r.track_id, target: r.track_genre });
    });

    // force simulation 會改變 links and nodes, 所以複製一份在re-evaluating時才會有同樣結果
    const nodes = graph.nodes.map((d) => ({ ...d }));
    const links = graph.links.map((d) => ({ ...d }));
    renderNodeGraphAndRadarChart(nodes, links);

    // User input
    let selectedGenresSet = new Set();
    const selectedGenresCount = document.getElementById("genres-count");
    let xAxisProperty = document.querySelector("#scatter-x-property");
    let yAxisProperty = document.querySelector("#scatter-y-property");

    const genreCheckBoxes = document.querySelectorAll(
        "#genres-container input"
    );
    genreCheckBoxes.forEach((inputElement) => {
        inputElement.addEventListener("change", function (e) {
            d3.select("#lollipop-svg").remove();
            d3.select("#scatter-svg").remove();
            d3.select("#scatter-lollipop-legend-svg").remove();

            if (e.target.checked) {
                selectedGenresSet.add(e.target.value);
                selectedGenresCount.innerText = `${selectedGenresSet.size}/10`;
                console.log(selectedGenresSet);
            } else {
                selectedGenresSet.delete(e.target.value);
                selectedGenresCount.innerText = `${selectedGenresSet.size}/10`;
            }

            if (selectedGenresSet.size > 10) {
                selectedGenresSet.delete(e.target.value);
                selectedGenresCount.innerText = `${selectedGenresSet.size}/10`;
                e.target.checked = false;
                alert("Maximum of 10 Genres can be selected at the same time!");
            }

            let selectedDataArrayForScatterAndLollipop = [];
            tmpRawDataArray.forEach((t) => {
                if (selectedGenresSet.has(t.track_genre)) {
                    selectedDataArrayForScatterAndLollipop.push(t);
                }
            });

            renderScatterAndLollipopChart(
                selectedDataArrayForScatterAndLollipop,
                yAxisProperty[yAxisProperty.selectedIndex].value,
                xAxisProperty[xAxisProperty.selectedIndex].value
            );
        });
    });
    document
        .querySelector("#scatter-x-axis-option")
        .addEventListener("change", function (e) {
            if (selectedGenresSet.size == 0) {
                alert(
                    "You haven't choose any genre. Please select genres to show charts :)"
                );
            }
            d3.select("#lollipop-svg").remove();
            d3.select("#scatter-svg").remove();
            d3.select("#scatter-lollipop-legend-svg").remove();

            let selectedDataArrayForScatterAndLollipop = [];
            tmpRawDataArray.forEach((t) => {
                if (selectedGenresSet.has(t.track_genre)) {
                    selectedDataArrayForScatterAndLollipop.push(t);
                }
            });

            renderScatterAndLollipopChart(
                selectedDataArrayForScatterAndLollipop,
                yAxisProperty[yAxisProperty.selectedIndex].value,
                xAxisProperty[xAxisProperty.selectedIndex].value
            );
        });

    document
        .querySelector("#scatter-y-axis-option")
        .addEventListener("change", function (e) {
            if (selectedGenresSet.size == 0) {
                alert(
                    "You haven't choose any genre. Please select genres to show charts :)"
                );
            }
            d3.select("#lollipop-svg").remove();
            d3.select("#scatter-svg").remove();
            d3.select("#scatter-lollipop-legend-svg").remove();

            let selectedDataArrayForScatterAndLollipop = [];
            tmpRawDataArray.forEach((t) => {
                if (selectedGenresSet.has(t.track_genre)) {
                    selectedDataArrayForScatterAndLollipop.push(t);
                }
            });

            renderScatterAndLollipopChart(
                selectedDataArrayForScatterAndLollipop,
                yAxisProperty[yAxisProperty.selectedIndex].value,
                xAxisProperty[xAxisProperty.selectedIndex].value
            );
        });

    //  Default empty
    renderScatterAndLollipopChart([], "danceability", "liveness");
});

const renderNodeGraphAndRadarChart = (nodes, links) => {
    // 1: Radar Chart
    const radarSvg = d3
        .select(".radar-chart-container")
        .append("svg")
        .attr("id", "radar-chart")
        .attr("width", radarWidth)
        .attr("height", radarHeight)
        .attr("viewBox", [0, 0, radarWidth, radarHeight]);

    const radialScale = d3.scaleLinear().domain([0, 1]).range([0, 250]);
    const circleTicks = [0.2, 0.4, 0.6, 0.8, 1.0];

    radarSvg
        .append("g")
        .attr("id", "radar_circle_group")
        .selectAll("radar_circle")
        .data(circleTicks)
        .join("circle")
        .attr("class", "radar_circle")
        .attr("cx", radarWidth / 2)
        .attr("cy", radarHeight / 2)
        .attr("fill", "none")
        .attr("stroke", "gray")
        .attr("r", (d) => {
            return radialScale(d);
        });

    radarSvg
        .selectAll(".ticklabel")
        .data(circleTicks)
        .join("text")
        .attr("class", "tick_label")
        .style("fill", "gray")
        .attr("x", radarWidth / 2)
        .attr("y", (d) => radarHeight / 2 - radialScale(d))
        .text((d) => d.toString());

    function angleToCoordinate(angle, value) {
        let x = Math.cos(angle) * radialScale(value);
        let y = Math.sin(angle) * radialScale(value);
        return { x: radarWidth / 2 + x, y: radarHeight / 2 - y };
    }

    let featureData = radarFeatures.map((f, i) => {
        let angle = Math.PI / 2 + (2 * Math.PI * i) / radarFeatures.length;
        return {
            name: f,
            angle: angle,
            line_coord: angleToCoordinate(angle, 1),
            label_coord: angleToCoordinate(angle, 1.1),
        };
    });

    radarSvg
        .selectAll("line")
        .data(featureData)
        .join("line")
        .attr("x1", radarWidth / 2)
        .attr("y1", radarHeight / 2)
        .attr("x2", (d) => d.line_coord.x)
        .attr("y2", (d) => d.line_coord.y)
        .attr("stroke", "white");

    radarSvg
        .selectAll(".axislabel")
        .data(featureData)
        .join("text")
        .attr("x", (d) => d.label_coord.x)
        .attr("y", (d) => d.label_coord.y)
        .style("fill", "white")
        .text((d) => d.name);

    let line = d3
        .line()
        .x((d) => d.x)
        .y((d) => d.y);

    function getPathCoordinates(data) {
        let coordinates = [];
        for (let i = 0; i < radarFeatures.length; i++) {
            let featureName = radarFeatures[i];
            let angle = Math.PI / 2 + (2 * Math.PI * i) / radarFeatures.length;
            coordinates.push(
                angleToCoordinate(angle, parseFloat(data[featureName]))
            );
        }
        return coordinates;
    }

    // 2: Force Directed Graph
    const svg = d3
        .select(".forced-graph-container")
        .append("svg")
        .attr("id", "graph")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .append("g");

    // Create a simulation with several forces.
    const simulation = d3
        .forceSimulation(nodes)
        .force("charge", d3.forceManyBody().strength(-100)) // strength 像是彼此之間的推力
        .force(
            "link",
            d3
                .forceLink(links)
                .id((d) => d.id)
                .distance(30)
                .strength(1)
        )
        .force("center", d3.forceCenter(width / 2, height / 2))
        .force("x", d3.forceX())
        .force("y", d3.forceY())
        .on("tick", ticked);

    // See https://github.com/d3/d3-force/blob/master/README.md#simulation_tick
    // simulation.tick(n) runs n iterations of a force simulation layout.
    simulation.tick(
        Math.ceil(
            Math.log(simulation.alphaMin()) /
                Math.log(1 - simulation.alphaDecay())
        )
    );

    const link = svg
        .append("g")
        .attr("id", "all-links")
        .selectAll(".link")
        .data(links)
        .enter()
        .append("line")
        .attr("class", "link")
        .attr("stroke", "#ddd")
        .attr("stroke-width", 1.5);

    const node = svg
        .append("g")
        .attr("id", "all-nodes")
        .selectAll(".node")
        .data(nodes)
        .enter()
        .append("circle")
        .attr("class", "node")
        .attr("r", (d) => {
            switch (d.nodeType) {
                case "artist":
                    return 8;
                case "genre":
                    return 10;
                case "track":
                    return 6;
                default:
                    break;
            }
            return 6;
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 1.5)
        .attr("fill", (d) => color(d.nodeType));

    // Set the position attributes of links and nodes each time the simulation ticks.
    function ticked() {
        link.attr("x1", (d) => d.source.x)
            .attr("y1", (d) => d.source.y)
            .attr("x2", (d) => d.target.x)
            .attr("y2", (d) => d.target.y);
        node.attr("cx", (d) => d.x).attr("cy", (d) => d.y);
    }

    const tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "tooltip")
        .attr("style", "position: absolute; opacity: 0; font-size: 14px;")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "10px");

    const mouseover = function (_d) {
        tooltip.style("opacity", 1.0);
        d3.select(this).style("opacity", 0.5);
    };

    const mousemove = function (event, d, _i) {
        let title = "";
        let mouseOnDataPoint = [];
        mouseOnDataPoint.push(d);
        let trackDetails = "";
        switch (d.nodeType) {
            case "artist":
                title = d.artistName;
                break;
            case "genre":
                title = d.genreName;
                break;
            case "track":
                // when hovering graph node which type is "track" show its properties on radar chart
                radarSvg
                    .selectAll("path")
                    .data(mouseOnDataPoint)
                    .join("path")
                    .datum((d) => getPathCoordinates(d))
                    .attr("d", line)
                    .attr("stroke-width", 3)
                    .attr("stroke", (_d, _i) => {
                        return "darkorange";
                    })
                    .attr("fill", (_d, _i) => "darkorange")
                    .attr("stroke-opacity", 1)
                    .attr("opacity", 0.5);
                title = d.trackName;
                trackDetails = `<br/>Genre: ${d.genre}<br/>Album: ${d.album}<br/>Popularity: ${d.popularity}<br/>Danceability: ${d.danceability}<br/>Speechiness: ${d.speechiness}<br/>Acousticness: ${d.acousticness}<br/>Instrumentalness: ${d.instrumentalness}<br/>Liveness: ${d.liveness}`;
                break;
            default:
                break;
        }
        tooltip
            .html(
                `Node Type: ${d.nodeType}` +
                    "<br/>" +
                    `Node Name: ${title}` +
                    `${trackDetails}`
            )
            .style("top", event.pageY - 20 + "px")
            .style("left", event.pageX + 20 + "px");
    };

    const mouseleave = function (_d) {
        tooltip.style("opacity", 0);
        d3.select(this).style("opacity", 1);
    };

    node.on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

    // node drag behavior
    node.call(
        d3
            .drag()
            .on("start", dragstarted)
            .on("drag", dragged)
            .on("end", dragended)
    );

    // Reheat the simulation when drag starts, and fix the subject position.
    function dragstarted(event) {
        if (!event.active) simulation.alphaTarget(0.3).restart();
        event.subject.fx = event.subject.x;
        event.subject.fy = event.subject.y;
    }

    // Update the subject (dragged node) position during drag.
    function dragged(event) {
        event.subject.fx = event.x;
        event.subject.fy = event.y;
    }

    // Restore the target alpha so the simulation cools after dragging ends.
    // Unfix the subject position now that it’s no longer being dragged.
    function dragended(event) {
        if (!event.active) simulation.alphaTarget(0);
        event.subject.fx = null;
        event.subject.fy = null;
    }
};

const renderScatterAndLollipopChart = (data, xAttr, yAttr) => {
    // 1: Lollipop
    const genreCountMap = {}; // key: pop, val: 100
    const genrePopularitySumMap = {}; // key: pop, val: 1000

    data.forEach((d) => {
        if (!genreCountMap[d.track_genre]) {
            // 此 genre 第一次出現加入
            genreCountMap[d.track_genre] = 0;
            genrePopularitySumMap[d.track_genre] = 0;
        }

        genreCountMap[d.track_genre] += 1;
        genrePopularitySumMap[d.track_genre] += +d.popularity;
    });

    let dataForLollipop = [];
    for (const g in genreCountMap) {
        const avg = genrePopularitySumMap[g] / genreCountMap[g];
        dataForLollipop.push({
            genre: g,
            popularityAvg: avg,
        });
    }

    dataForLollipop.sort((a, b) => a.popularityAvg - b.popularityAvg);

    const lollipopSvg = d3
        .select(".lollipop-chart-container")
        .append("svg")
        .attr("id", "lollipop-svg")
        .attr(
            "width",
            lollipopWidth + lollipopMargin.left + lollipopMargin.right
        )
        .attr(
            "height",
            lollipopHeight + lollipopMargin.bottom + lollipopMargin.top
        )
        .attr("transform", `translate(0, 50)`);

    const xl = d3
        .scaleBand()
        .domain(dataForLollipop.map((d) => d.genre))
        .range([0, lollipopWidth])
        .padding(1);

    lollipopSvg
        .append("g")
        .attr(
            "transform",
            `translate(${lollipopMargin.left}, ${lollipopHeight + 10})`
        )
        .attr("class", "l-x-axis-group")
        .call(d3.axisBottom(xl))
        .selectAll("text")
        .attr("transform", "translate(-10,0)rotate(-45)")
        .style("text-anchor", "end");

    const yl = d3.scaleLinear().domain([0, 100]).range([lollipopHeight, 0]);

    lollipopSvg
        .append("g")
        .attr("transform", `translate(${lollipopMargin.left}, 10)`)
        .attr("class", "l-y-axis-group")
        .call(d3.axisLeft(yl));

    lollipopSvg
        .selectAll(".myLine")
        .data(dataForLollipop)
        .enter()
        .append("line")
        .attr("class", "lollipop-line")
        .transition()
        .duration(1000)
        .attr("x1", function (d) {
            return xl(d.genre);
        })
        .attr("x2", function (d) {
            return xl(d.genre);
        })
        .attr("y1", (d) => yl(d.popularityAvg))
        .attr("y2", yl(0))
        .attr("transform", `translate(${lollipopMargin.left}, 10)`)
        .attr("stroke", (d) => color(d.genre));

    lollipopSvg
        .selectAll("l-circle")
        .data(dataForLollipop)
        .enter()
        .append("circle")
        .attr("class", "lollipop-circle")
        .transition()
        .duration(1000)
        .attr("cx", function (d) {
            return xl(d.genre);
        })
        .attr("cy", function (d) {
            return yl(d.popularityAvg);
        })
        .attr("transform", `translate(${lollipopMargin.left}, 10)`)
        .attr("r", 8)
        .attr("fill", (d) => color(d.genre));

    lollipopSvg
        .selectAll("l-circle-title")
        .append("g")
        .data(dataForLollipop)
        .enter()
        .append("text")
        .attr("class", "l-circle-title")
        .attr("x", function (d) {
            return xl(d.genre);
        })
        .attr("y", function (d) {
            return yl(d.popularityAvg) - 20;
        })
        .attr("transform", `translate(${lollipopMargin.left}, 10)`)
        .text((d) => `${d.popularityAvg}`)
        .attr("fill", "white")
        .style("text-anchor", "middle");

    const legendSvg = d3
        .select(".lollipop-chart-container")
        .append("svg")
        .attr("id", "scatter-lollipop-legend-svg")
        .attr("width", 200)
        .attr("height", 400)
        .append("g")
        .attr("transform", `translate(${0}, ${lollipopMargin.bottom})`);

    legendSvg
        .selectAll("myDots")
        .data(dataForLollipop)
        .enter()
        .append("circle")
        .attr("cx", 10)
        .attr("cy", function (_d, i) {
            return 0 + i * 25;
        })
        .attr("r", 6)
        .style("fill", function (d) {
            return color(d.genre);
        });

    legendSvg
        .selectAll("myLabels")
        .data(dataForLollipop)
        .enter()
        .append("text")
        .attr("x", 30)
        .attr("y", function (_d, i) {
            return 0 + i * 25;
        })
        .style("fill", function (d) {
            return color(d.genre);
        })
        .text(function (d) {
            return d.genre;
        })
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle");

    // 2: Scatter
    const scatterSVG = d3
        .select(".scatter-chart-container")
        .append("svg")
        .attr("id", "scatter-svg")
        .attr("width", width + scatterMargin + margin.right)
        .attr("height", height + margin.top + margin.bottom)
        .append("g")
        .attr("id", "scatter-chart")
        .attr(
            "transform",
            "translate(" + scatterMargin + "," + margin.top + ")"
        );

    const x = d3.scaleLinear().domain([0, 1]).range([0, width]);
    const y = d3.scaleLinear().domain([0, 1]).range([height, 0]);

    const scatterTooltip = d3
        .select("body")
        .append("div")
        .attr("class", "scatterTooltip")
        .attr("style", "position: absolute; opacity: 0; font-size: 14px;")
        .style("background-color", "white")
        .style("border", "solid")
        .style("border-width", "1px")
        .style("border-radius", "5px")
        .style("padding", "10px");

    const mouseover = function (_d) {
        scatterTooltip.style("opacity", 1.0);
        d3.select(this).style("opacity", 0.3);
    };

    const mousemove = function (event, d, _i) {
        scatterTooltip
            .html(
                `Track Name: ${d.track_name}<br/>Artist: ${d.artists}<br/>Genre: ${d.track_genre}<br/>Album: ${d.album_name}<br/>Popularity: ${d.popularity}<br/>Danceability: ${d.danceability}<br/>Speechiness: ${d.speechiness}<br/>Acousticness: ${d.acousticness}<br/>Instrumentalness: ${d.instrumentalness}<br/>Liveness: ${d.liveness}`
            )
            .style("top", event.pageY - 20 + "px")
            .style("left", event.pageX + 20 + "px");
    };

    const mouseleave = function (_d) {
        scatterTooltip.style("opacity", 0);
        d3.select(this).style("opacity", 1);
    };

    const xAxis = scatterSVG
        .append("g")
        .attr("class", "s-x-axis-group")
        .attr("transform", "translate(0," + height + ")")
        .call(d3.axisBottom(x));

    const yAxis = scatterSVG
        .append("g")
        .attr("class", "s-y-axis-group")
        .call(d3.axisLeft(y));

    // add <defs> to define <clipPath> so the chart won't overflow when zoom in
    // https://www.oxxostudio.tw/articles/201409/svg-18-defs.html
    const clip = scatterSVG
        .append("defs")
        .append("scatterSVG:clipPath")
        .attr("id", "clip") // for later url($clip) usage
        .append("scatterSVG:rect")
        .attr("width", width)
        .attr("height", height)
        .attr("x", 0)
        .attr("y", 0);

    // draw points in this g
    const scatter = scatterSVG
        .append("g")
        .attr("id", "scatter-circles-group")
        .attr("clip-path", "url(#clip)");

    // add an invisible frame outside the scatter chart so the points outside of the zoom scope won't displayed
    const zoom = d3
        .zoom()
        .scaleExtent([0.5, 5]) // This control how much you can unzoom (x0.5) and zoom (x5)
        .extent([
            [0, 0],
            [width, height],
        ])

        .on("zoom", updateChart);

    scatter
        .append("rect")
        .attr("id", "zoom-invisible-rect")
        .attr("width", width)
        .attr("height", height)
        .style("fill", "none")
        .style("pointer-events", "visible")
        .attr(
            "transform",
            "translate(" + scatterMargin + "," + margin.top + ")"
        )
        .call(zoom);

    // after outside frame define we can draw points
    scatter
        .selectAll("circle")
        .data(data)
        .enter()
        .append("circle")
        .attr("cx", function (d) {
            return x(d[xAttr]);
        })
        .attr("cy", function (d) {
            return y(d[yAttr]);
        })
        .attr("r", 3.0)
        .style("fill", (d) => color(d.track_genre))
        .style("opacity", 0.5)
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

    function updateChart(event) {
        // recover the new scale
        const newX = event.transform.rescaleX(x);
        const newY = event.transform.rescaleY(y);

        // update axes with these new boundaries
        xAxis.call(d3.axisBottom(newX));
        yAxis.call(d3.axisLeft(newY));

        // update circle position
        scatter
            .selectAll("circle")
            .attr("cx", function (d) {
                return newX(d[xAttr]);
            })
            .attr("cy", function (d) {
                return newY(d[yAttr]);
            });
    }
};

const renderAveragePopularityTable = (rawData) => {
    const genreCountMap = {}; // key: pop, val: 100
    const genrePopularitySumMap = {}; // key: pop, val: 1000

    rawData.forEach((d) => {
        if (!genreCountMap[d.track_genre]) {
            genreCountMap[d.track_genre] = 0;
            genrePopularitySumMap[d.track_genre] = 0;
        }

        genreCountMap[d.track_genre] += 1;
        genrePopularitySumMap[d.track_genre] += +d.popularity;
    });

    let data = [];
    for (const g in genreCountMap) {
        const avg = genrePopularitySumMap[g] / genreCountMap[g];
        data.push({
            genre: g,
            popularityAvg: avg,
        });
    }

    data.sort((a, b) => b.popularityAvg - a.popularityAvg);

    // create a div
    data.forEach((d) => {
        let tr = document.createElement("tr");

        // create a cell
        let td1 = document.createElement("td");
        let td2 = document.createElement("td");
        td1.innerText = d.genre;
        td2.innerText = d.popularityAvg;

        // add the checkbox and label to the div
        tr.appendChild(td1);
        tr.appendChild(td2);

        // append the div to the container div
        document.getElementById("table-container").appendChild(tr);
    });
}