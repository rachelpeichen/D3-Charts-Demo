const width = 960;
const height = 960;
const margin = {
    top: 20,
    right: 20,
    bottom: 20,
    left: 20,
};
const graphInnerWidth = width - margin.left - margin.right;
const graphInnerHeight = height - margin.top - margin.bottom;
const allNodesName = [
    "vhigh#buying",
    "buying",
    "vhigh#maint",
    "maint",
    "2#doors",
    "doors",
    "2#persons",
    "persons",
    "small#lug_boot",
    "lug_boot",
    "low#safety",
    "safety",
    "med#safety",
    "high#safety",
    "med#lug_boot",
    "big#lug_boot",
    "4#persons",
    "more#persons",
    "3#doors",
    "4#doors",
    "5more#doors",
    "high#maint",
    "med#maint",
    "low#maint",
    "high#buying",
    "med#buying",
    "low#buying",
    "unacc",
    "acc",
    "vgood",
    "good",
];
const color = d3.scaleOrdinal().domain(allNodesName).range(d3.schemeSet2);

// data format is .data so we cannot read it by d3.csv
const response = await fetch("SankeyChartData.data");
const blob = await response.blob();
const reader = new FileReader();

reader.onload = (evt) => {
    // will onload when finished reading data (line 49) so we render chart here
    const rawResult = evt.target.result;
    const rows = rawResult.split("\n");
    const rawDataArray = rows.map((row) => {
        const values = row.split(",");
        return {
            buying: values[0],
            maint: values[1],
            doors: values[2],
            persons: values[3],
            lug_boot: values[4],
            safety: values[5],
            class: values[6],
        };
    });

    const tmpData = [];
    const classCountMap = {}; // key: acc val: { vhigh_buying: 1, high_buying: 2, ...}

    rawDataArray.forEach((rawData) => {
        const className = rawData.class;
        if (!classCountMap[className]) {
            classCountMap[className] = {};
        }
        for (const key in rawData) {
            if (key !== "class") {
                const sourceType = `${rawData[key]}#${key}`; // vhigh#buying
                if (!classCountMap[className][sourceType]) {
                    classCountMap[className][sourceType] = 0;
                }
                classCountMap[className][sourceType]++;
            }
        }
    });

    for (const className in classCountMap) {
        for (const sourceType in classCountMap[className]) {
            tmpData.push({
                source: sourceType,
                target: sourceType.split("#")[1],
                value: classCountMap[className][sourceType],
                class: className,
            });
        }
    }

    // Calculate frequency for target and class
    const targetClassCountMap = {}; // key: buying, val: { unacc: 1210, acc: 384... }

    tmpData.forEach((d) => {
        const target = d.target;
        const className = d.class;

        if (!targetClassCountMap[target]) {
            targetClassCountMap[target] = {};
        }

        if (!targetClassCountMap[target][className]) {
            targetClassCountMap[target][className] = 0;
        }

        targetClassCountMap[target][className] += d.value;
    });

    // Create an array to store { source: 'buying', target: 'unacc', value: 1210 }
    const targetClassCountArray = [];

    for (const target in targetClassCountMap) {
        for (const className in targetClassCountMap[target]) {
            targetClassCountArray.push({
                source: target,
                target: className,
                value: targetClassCountMap[target][className],
            });
        }
    }

    // Step 1: format data to draw sankey chart
    const formattedDataArray = tmpData.concat(targetClassCountArray);

    let graph = { nodes: [], links: [] }; // nodes 是節點，links 是長條連接線
    formattedDataArray.forEach(function (d) {
        graph.nodes.push({ name: d.source });
        graph.nodes.push({ name: d.target });
        graph.links.push({
            source: d.source,
            target: d.target,
            value: +d.value,
        });
    });

    // only unique nodes
    graph.nodes = d3.keys(
        d3
            .nest()
            .key((d) => d.name)
            .object(graph.nodes)
    );

    // loop through each link replacing the text with its index from node
    graph.links.forEach(function (d, i) {
        graph.links[i].source = graph.nodes.indexOf(graph.links[i].source);
        graph.links[i].target = graph.nodes.indexOf(graph.links[i].target);
    });

    // convert nodes from string array to an array of objects
    graph.nodes.forEach(function (d, i) {
        graph.nodes[i] = { name: d };
    });

    const svg = d3
        .select(".chart-container")
        .append("svg")
        .attr("id", "graph")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    // set sankey diagram properties
    const sankey = d3
        .sankey()
        .nodeWidth(40)
        .nodePadding(10)
        .size([graphInnerWidth, graphInnerHeight]);
    sankey.nodes(graph.nodes).links(graph.links).layout(10);

    const path = sankey.link();
    const link = svg
        .append("g")
        .selectAll(".link")
        .data(graph.links)
        .enter()
        .append("path")
        .attr("class", "link")
        .attr("d", path)
        .style("stroke-width", (d) => Math.max(1, d.dy))
        .sort((a, b) => b.dy - a.dy);

    const tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "tooltip")
        .attr("style", "position: absolute; opacity: 0; font-size: 20px;");

    const mouseover = function (_d) {
        tooltip.style("opacity", 1.0);
        d3.select(this).style("opacity", 1.0);
    };

    const mousemove = function (event, d, i) {
        console.log(d);
        const p = d.source.name.split("#")[0];
        const c = d.source.name.split("#")[1] ?? d.target.name;
        let htmlContent;
        if (d.source.name.split("#")[1]) {
            htmlContent =
                `Property: ${p} ➡ Category: ${c}` + "\n" + `Count: ${d.value}`;
        } else {
            htmlContent =
                `Category: ${p} ➡ Class: ${c}` + "\n" + `Count: ${d.value}`;
        }
        tooltip
            .html(htmlContent)
            .style("top", event.pageY - 20 + "px")
            .style("left", event.pageX + 20 + "px");
    };

    const mouseleave = function (_d) {
        tooltip.style("opacity", 0);
        d3.select(this).style("opacity", 1);
    };

    link.on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

    const node = svg
        .append("g")
        .selectAll(".node")
        .data(graph.nodes)
        .enter()
        .append("g")
        .attr("class", "node")
        .attr("transform", (d) => "translate(" + d.x + "," + d.y + ")")
        .call(
            d3
                .drag()
                .subject(function (d) {
                    return d;
                })
                .on("start", function () {
                    this.parentNode.appendChild(this);
                })
                .on("drag", function (event, d) {
                    // cannot use arrow function when drag because of "this" scope
                    d3.select(this).attr(
                        "transform",
                        "translate(" +
                            (d.x = Math.max(
                                0,
                                Math.min(width - d.dx, event.x)
                            )) +
                            "," +
                            (d.y = Math.max(
                                0,
                                Math.min(height - d.dy, event.y)
                            )) +
                            ")"
                    );
                    sankey.relayout();
                    link.attr("d", path);
                })
        );

    node.append("rect")
        .attr("height", (d) => d.dy)
        .attr("width", sankey.nodeWidth())
        .style("fill", (d) => {
            console.log("d.name & color", d.name, color(d.name));
            return color(d.name);
        })
        .style("stroke", "#000")
        .append("title")
        .text((d) => d.name + "\n" + `Count: ${d.value}`);

    node.append("text")
        .attr("x", -6)
        .attr("y", function (d) {
            return d.dy / 2;
        })
        .attr("dy", ".35em")
        .attr("text-anchor", "end")
        .attr("transform", null)
        .text(function (d) {
            return d.name;
        })
        .filter(function (d) {
            return d.x < width / 2;
        })
        .attr("x", 6 + sankey.nodeWidth())
        .attr("text-anchor", "start");

    const legendSvg = d3
        .select(".hw8-container")
        .append("svg")
        .attr("id", "legend")
        .attr("width", width)
        .attr("height", height)
        .append("g")
        .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

    legendSvg.selectAll("myDots")
        .data(allNodesName)
        .enter()
        .append("circle")
        .attr("cx", margin.left)
        .attr("cy", function (_d, i) {
            return 0 + i * 30;
        })
        .attr("r", 8)
        .style("fill", function (d) {
            return color(d);
        });

    legendSvg.selectAll("myLabels")
        .data(allNodesName)
        .enter()
        .append("text")
        .attr("x",  30)
        .attr("y", function (_d, i) {
            return 0 + i * 30;
        })
        .style("fill", function (d) {
            return color(d);
        })
        .text(function (d) {
            return d;
        })
        .attr("text-anchor", "left")
        .style("alignment-baseline", "middle");
};
reader.readAsText(blob);

// d3.Sankey methods copy paste here
d3.sankey = function () {
    var sankey = {},
        nodeWidth = 24,
        nodePadding = 8,
        size = [1, 1],
        nodes = [],
        links = [];

    sankey.nodeWidth = function (_) {
        if (!arguments.length) return nodeWidth;
        nodeWidth = +_;
        return sankey;
    };

    sankey.nodePadding = function (_) {
        if (!arguments.length) return nodePadding;
        nodePadding = +_;
        return sankey;
    };

    sankey.nodes = function (_) {
        if (!arguments.length) return nodes;
        nodes = _;
        return sankey;
    };

    sankey.links = function (_) {
        if (!arguments.length) return links;
        links = _;
        return sankey;
    };

    sankey.size = function (_) {
        if (!arguments.length) return size;
        size = _;
        return sankey;
    };

    sankey.layout = function (iterations) {
        computeNodeLinks();
        computeNodeValues();
        computeNodeBreadths();
        computeNodeDepths(iterations);
        computeLinkDepths();
        return sankey;
    };

    sankey.relayout = function () {
        computeLinkDepths();
        return sankey;
    };

    sankey.link = function () {
        var curvature = 0.5;

        function link(d) {
            var x0 = d.source.x + d.source.dx,
                x1 = d.target.x,
                xi = d3.interpolateNumber(x0, x1),
                x2 = xi(curvature),
                x3 = xi(1 - curvature),
                y0 = d.source.y + d.sy + d.dy / 2,
                y1 = d.target.y + d.ty + d.dy / 2;
            return (
                "M" +
                x0 +
                "," +
                y0 +
                "C" +
                x2 +
                "," +
                y0 +
                " " +
                x3 +
                "," +
                y1 +
                " " +
                x1 +
                "," +
                y1
            );
        }

        link.curvature = function (_) {
            if (!arguments.length) return curvature;
            curvature = +_;
            return link;
        };

        return link;
    };

    // Populate the sourceLinks and targetLinks for each node.
    // Also, if the source and target are not objects, assume they are indices.
    function computeNodeLinks() {
        nodes.forEach(function (node) {
            node.sourceLinks = [];
            node.targetLinks = [];
        });
        links.forEach(function (link) {
            var source = link.source,
                target = link.target;
            if (typeof source === "number")
                source = link.source = nodes[link.source];
            if (typeof target === "number")
                target = link.target = nodes[link.target];
            source.sourceLinks.push(link);
            target.targetLinks.push(link);
        });
    }

    // Compute the value (size) of each node by summing the associated links.
    function computeNodeValues() {
        nodes.forEach(function (node) {
            node.value = Math.max(
                d3.sum(node.sourceLinks, value),
                d3.sum(node.targetLinks, value)
            );
        });
    }

    // Iteratively assign the breadth (x-position) for each node.
    // Nodes are assigned the maximum breadth of incoming neighbors plus one;
    // nodes with no incoming links are assigned breadth zero, while
    // nodes with no outgoing links are assigned the maximum breadth.
    function computeNodeBreadths() {
        var remainingNodes = nodes,
            nextNodes,
            x = 0;

        while (remainingNodes.length) {
            nextNodes = [];
            remainingNodes.forEach(function (node) {
                node.x = x;
                node.dx = nodeWidth;
                node.sourceLinks.forEach(function (link) {
                    if (nextNodes.indexOf(link.target) < 0) {
                        nextNodes.push(link.target);
                    }
                });
            });
            remainingNodes = nextNodes;
            ++x;
        }

        //
        moveSinksRight(x);
        scaleNodeBreadths((size[0] - nodeWidth) / (x - 1));
    }

    function moveSourcesRight() {
        nodes.forEach(function (node) {
            if (!node.targetLinks.length) {
                node.x =
                    d3.min(node.sourceLinks, function (d) {
                        return d.target.x;
                    }) - 1;
            }
        });
    }

    function moveSinksRight(x) {
        nodes.forEach(function (node) {
            if (!node.sourceLinks.length) {
                node.x = x - 1;
            }
        });
    }

    function scaleNodeBreadths(kx) {
        nodes.forEach(function (node) {
            node.x *= kx;
        });
    }

    function computeNodeDepths(iterations) {
        var nodesByBreadth = d3
            .nest()
            .key(function (d) {
                return d.x;
            })
            .sortKeys(d3.ascending)
            .entries(nodes)
            .map(function (d) {
                return d.values;
            });

        //
        initializeNodeDepth();
        resolveCollisions();
        for (var alpha = 1; iterations > 0; --iterations) {
            relaxRightToLeft((alpha *= 0.99));
            resolveCollisions();
            relaxLeftToRight(alpha);
            resolveCollisions();
        }

        function initializeNodeDepth() {
            var ky = d3.min(nodesByBreadth, function (nodes) {
                return (
                    (size[1] - (nodes.length - 1) * nodePadding) /
                    d3.sum(nodes, value)
                );
            });

            nodesByBreadth.forEach(function (nodes) {
                nodes.forEach(function (node, i) {
                    node.y = i;
                    node.dy = node.value * ky;
                });
            });

            links.forEach(function (link) {
                link.dy = link.value * ky;
            });
        }

        function relaxLeftToRight(alpha) {
            nodesByBreadth.forEach(function (nodes, breadth) {
                nodes.forEach(function (node) {
                    if (node.targetLinks.length) {
                        var y =
                            d3.sum(node.targetLinks, weightedSource) /
                            d3.sum(node.targetLinks, value);
                        node.y += (y - center(node)) * alpha;
                    }
                });
            });

            function weightedSource(link) {
                return center(link.source) * link.value;
            }
        }

        function relaxRightToLeft(alpha) {
            nodesByBreadth
                .slice()
                .reverse()
                .forEach(function (nodes) {
                    nodes.forEach(function (node) {
                        if (node.sourceLinks.length) {
                            var y =
                                d3.sum(node.sourceLinks, weightedTarget) /
                                d3.sum(node.sourceLinks, value);
                            node.y += (y - center(node)) * alpha;
                        }
                    });
                });

            function weightedTarget(link) {
                return center(link.target) * link.value;
            }
        }

        function resolveCollisions() {
            nodesByBreadth.forEach(function (nodes) {
                var node,
                    dy,
                    y0 = 0,
                    n = nodes.length,
                    i;

                // Push any overlapping nodes down.
                nodes.sort(ascendingDepth);
                for (i = 0; i < n; ++i) {
                    node = nodes[i];
                    dy = y0 - node.y;
                    if (dy > 0) node.y += dy;
                    y0 = node.y + node.dy + nodePadding;
                }

                // If the bottommost node goes outside the bounds, push it back up.
                dy = y0 - nodePadding - size[1];
                if (dy > 0) {
                    y0 = node.y -= dy;

                    // Push any overlapping nodes back up.
                    for (i = n - 2; i >= 0; --i) {
                        node = nodes[i];
                        dy = node.y + node.dy + nodePadding - y0;
                        if (dy > 0) node.y -= dy;
                        y0 = node.y;
                    }
                }
            });
        }

        function ascendingDepth(a, b) {
            return a.y - b.y;
        }
    }

    function computeLinkDepths() {
        nodes.forEach(function (node) {
            node.sourceLinks.sort(ascendingTargetDepth);
            node.targetLinks.sort(ascendingSourceDepth);
        });
        nodes.forEach(function (node) {
            var sy = 0,
                ty = 0;
            node.sourceLinks.forEach(function (link) {
                link.sy = sy;
                sy += link.dy;
            });
            node.targetLinks.forEach(function (link) {
                link.ty = ty;
                ty += link.dy;
            });
        });

        function ascendingSourceDepth(a, b) {
            return a.source.y - b.source.y;
        }

        function ascendingTargetDepth(a, b) {
            return a.target.y - b.target.y;
        }
    }

    function center(node) {
        return node.y + node.dy / 2;
    }

    function value(link) {
        return link.value;
    }

    return sankey;
};
