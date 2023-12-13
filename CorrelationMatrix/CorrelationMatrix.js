const width = 800;
const height = 800;
const legendHeight = 200;
const xAxisHeight = 200;
const margin = { top: 30, right: 220, bottom: 220, left: 20 };
const graphInnerWidth = width - margin.left - margin.right;
const graphInnerHeight = width - margin.top - margin.bottom;
const colorCodeSet = ["#cc0022", "#ffd206", "#137458"];
const color = d3.scaleLinear().domain([-1, 0, 1]).range(colorCodeSet);
const attributes = [
    "Subscribers",
    "Video_Views",
    "Uploads",
    "Lowest_Monthly_Earnings",
    "Highest_Monthly_Earnings",
    "Gross_Tertiary_Education_Enrollment",
    "Unemployment_Rate",
    "Popoulation",
    "Urban_Population",
    "Created_Year",
];

d3.csv("CorrelationMatrixData.csv").then((rawData) => {
    createAttributesCheckboxes(attributes);

    // Add legend
    const legendSvg = Legend(d3.scaleDiverging([-1, 0, 1], colorCodeSet), {
        title: "Correlation",
        marginLeft: margin.left,
    });
    const legendDiv = document.getElementById("legend-container");
    legendDiv.appendChild(legendSvg);

    // Drop video views == 0 & drop nan (There are a number of YouTube channels which have 0 video views, these appear to be YouTube topics & not valid channels, for the purpose of this analysis these rows will be removed)
    const filterData = rawData.filter(
        (d) =>
            d["video views"] != 0 &&
            !isNaN(+d["subscribers"]) &&
            !isNaN(+d["video views"]) &&
            !isNaN(+d["uploads"]) &&
            !isNaN(+d["lowest_monthly_earnings"]) &&
            !isNaN(+d["highest_monthly_earnings"]) &&
            !isNaN(+d["Gross tertiary education enrollment (%)"]) &&
            !isNaN(+d["Unemployment rate"]) &&
            !isNaN(+d["Population"]) &&
            !isNaN(+d["Urban_population"]) &&
            !isNaN(+d["created_year"])
    );
    const data = filterData.map((d) => {
        return {
            Subscribers: +d["subscribers"],
            Video_Views: +d["video views"],
            Uploads: +d["uploads"],
            Lowest_Monthly_Earnings: +d["lowest_monthly_earnings"],
            Highest_Monthly_Earnings: +d["highest_monthly_earnings"],
            Gross_Tertiary_Education_Enrollment:
                +d["Gross tertiary education enrollment (%)"],
            Unemployment_Rate: +d["Unemployment rate"],
            Popoulation: +d["Population"],
            Urban_Population: +d["Urban_population"],
            Created_Year: +d["created_year"],
        };
    });

    // Default show all
    renderCorrlationMatrix(data, attributes);

    // User Input
    let selectedAttrSet = new Set(attributes);
    const allCheckBoxes = document.querySelectorAll(
        "#attributes-container input"
    );

    allCheckBoxes.forEach((ele) => {
        ele.addEventListener("change", function (e) {
            d3.select("#matrix-svg").remove();
            // console.log(e.target.value);
            if (selectedAttrSet.has(e.target.value)) {
                selectedAttrSet.delete(e.target.value);
            } else {
                selectedAttrSet.add(e.target.value);
            }
            let selectedAttrArray = Array.from(selectedAttrSet);
            console.log("change", selectedAttrArray);
            renderCorrlationMatrix(data, selectedAttrArray);
        });
    });
});

const renderCorrlationMatrix = (data, selectedAttributes) => {
    // Calculate correlation
    const cors = jz.arr.correlationMatrix(data, selectedAttributes);
    const svg = d3
        .select("#matrix-container")
        .append("svg")
        .attr("id", "matrix-svg")
        .attr("width", width)
        .attr("height", height);

    const g = svg
        .append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    // Title
    g.append("text")
        .attr("class", "title")
        .attr("x", graphInnerWidth / 2)
        .attr("y", -15)
        .attr("text-anchor", "middle")
        .style("font-size", "1.2em")
        .text("Correlation Matrix Heatmap");

    // Create x scale
    const xScale = d3
        .scaleBand()
        .range([0, graphInnerWidth])
        .domain(selectedAttributes);

    // Define x axis
    const xAxis = d3
        .axisBottom()
        .scale(xScale)
        .tickFormat((d) => d.split("_").join(" "));

    // Draw whole x axis group
    const xAxisGroup = g
        .append("g")
        .attr("transform", `translate(0, ${graphInnerHeight})`)
        .attr("class", "x-axis-group")
        .call(xAxis)
        .call((g) => g.selectAll(".domain").remove()); // 去除掉軸兩邊會有小直線

    // x axis label styling
    xAxisGroup
        .selectAll("text")
        .attr("class", "x-axis-label")
        .attr("dx", "-10")
        .attr("dy", "-5")
        .attr("transform", "rotate(-90)");
    xAxisGroup.selectAll("line").attr("class", "axis-line");

    // Create y scale
    const yScale = d3
        .scaleBand()
        .range([0, graphInnerHeight])
        .domain(selectedAttributes);

    // Define y axis
    const yAxis = d3
        .axisRight()
        .scale(yScale)
        .tickFormat((d) => d.split("_").join(" "));

    // Draw whole y axis group
    const yAxisGroup = g
        .append("g")
        .attr("transform", `translate(${graphInnerWidth}, ${margin.top})`)
        .attr("class", "y-axis-group")
        .call(yAxis)
        .call((g) => g.selectAll(".domain").remove());

    // y axis label styling
    yAxisGroup
        .selectAll("text")
        .attr("class", "y-axis-label")
        .attr("dx", "-5")
        .attr("dy", "-20");
    yAxisGroup.selectAll("line").attr("class", "axis-line");

    // Create tooltip when mouse hovering
    const tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "tooltip")
        .attr("style", "position: absolute; opacity: 0;");

    const mouseover = function (_d) {
        tooltip.style("opacity", 1);
        d3.select(this).style("stroke", "white").style("opacity", 0.3);
    };

    const mousemove = function (event, d, _i) {
        let xAttr = d.column_x.split("_").join(" ");
        let yAttr = d.column_y.split("_").join(" ");
        tooltip
            .html(
                `X: ${xAttr}<br>Y: ${yAttr}<br>Correlation: ${d.correlation.toFixed(
                    4
                )}`
            )
            .style("top", event.pageY - 20 + "px")
            .style("left", event.pageX + 20 + "px");
    };

    const mouseleave = function (_d) {
        tooltip.style("opacity", 0);
        d3.select(this).style("stroke", "white").style("opacity", 1.0);
    };

    // Draw whole correlation matrix
    const cor = g
        .selectAll(".cor")
        .data(cors)
        .enter()
        .append("g")
        .attr("class", "cor")
        .attr("x", function (d) {
            return xScale(d.column_x);
        })
        .attr("transform", (d) => {
            return (
                "translate(" +
                xScale(d["column_x"]) +
                "," +
                yScale(d["column_y"]) +
                ")"
            );
        });

    cor.append("rect")
        .attr("class", "cor-rect")
        .attr("width", graphInnerWidth / selectedAttributes.length)
        .attr("height", graphInnerHeight / selectedAttributes.length)
        .attr("fill", (d) => color(d.correlation))
        .style("stroke-width", 1)
        .style("stroke", "white")
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

    // Draw correlation text inside each cell
    cor.append("text")
        .attr("class", "cor-text")
        .attr("x", graphInnerWidth / selectedAttributes.length / 2)
        .attr("y", graphInnerHeight / selectedAttributes.length / 2)
        .text((d) => d.correlation.toFixed(2));
};

// Helper methods
const createAttributesCheckboxes = (attributesArr) => {
    attributesArr.forEach((a) => {
        let div = document.createElement("div");
        div.setAttribute("class", "form-check-group");

        // create a checkbox
        let checkbox = document.createElement("input");
        checkbox.setAttribute("class", "form-check-input");
        checkbox.setAttribute("type", "checkbox");
        checkbox.setAttribute("checked", "checked");
        checkbox.setAttribute("id", a);
        checkbox.setAttribute("value", a);
        // create a label
        let label = document.createElement("label");
        label.setAttribute("class", "form-check-label");
        label.setAttribute("for", a);
        label.innerText = a.split("_").join(" ");

        // add the checkbox and label to the div
        div.appendChild(checkbox);
        div.appendChild(label);

        // append the div to the container div
        document.getElementById("attributes-container").appendChild(div);
    });
};

// Copyright 2021, Observable Inc.
// Released under the ISC license.
// https://observablehq.com/@d3/color-legend
function Legend(
    color,
    {
        title,
        tickSize = 6,
        width = 320,
        height = 44 + tickSize,
        marginTop = 18,
        marginRight = 0,
        marginBottom = 16 + tickSize,
        marginLeft = 0,
        ticks = width / 64,
        tickFormat,
        tickValues,
    } = {}
) {
    function ramp(color, n = 256) {
        const canvas = document.createElement("canvas");
        canvas.width = n;
        canvas.height = 1;
        const context = canvas.getContext("2d");
        for (let i = 0; i < n; ++i) {
            context.fillStyle = color(i / (n - 1));
            context.fillRect(i, 0, 1, 1);
        }
        return canvas;
    }

    const svg = d3
        .create("svg")
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .style("overflow", "visible")
        .style("display", "block");

    let tickAdjust = (g) =>
        g.selectAll(".tick line").attr("y1", marginTop + marginBottom - height);
    let x;

    // Continuous
    if (color.interpolate) {
        const n = Math.min(color.domain().length, color.range().length);

        x = color
            .copy()
            .rangeRound(
                d3.quantize(d3.interpolate(marginLeft, width - marginRight), n)
            );

        svg.append("image")
            .attr("x", marginLeft)
            .attr("y", marginTop)
            .attr("width", width - marginLeft - marginRight)
            .attr("height", height - marginTop - marginBottom)
            .attr("preserveAspectRatio", "none")
            .attr(
                "xlink:href",
                ramp(
                    color.copy().domain(d3.quantize(d3.interpolate(0, 1), n))
                ).toDataURL()
            );
    }

    // Sequential
    else if (color.interpolator) {
        x = Object.assign(
            color
                .copy()
                .interpolator(
                    d3.interpolateRound(marginLeft, width - marginRight)
                ),
            {
                range() {
                    return [marginLeft, width - marginRight];
                },
            }
        );

        svg.append("image")
            .attr("x", marginLeft)
            .attr("y", marginTop)
            .attr("width", width - marginLeft - marginRight)
            .attr("height", height - marginTop - marginBottom)
            .attr("preserveAspectRatio", "none")
            .attr("xlink:href", ramp(color.interpolator()).toDataURL());

        // scaleSequentialQuantile doesn’t implement ticks or tickFormat.
        if (!x.ticks) {
            if (tickValues === undefined) {
                const n = Math.round(ticks + 1);
                tickValues = d3
                    .range(n)
                    .map((i) => d3.quantile(color.domain(), i / (n - 1)));
            }
            if (typeof tickFormat !== "function") {
                tickFormat = d3.format(
                    tickFormat === undefined ? ",f" : tickFormat
                );
            }
        }
    }

    // Threshold
    else if (color.invertExtent) {
        const thresholds = color.thresholds
            ? color.thresholds() // scaleQuantize
            : color.quantiles
            ? color.quantiles() // scaleQuantile
            : color.domain(); // scaleThreshold

        const thresholdFormat =
            tickFormat === undefined
                ? (d) => d
                : typeof tickFormat === "string"
                ? d3.format(tickFormat)
                : tickFormat;

        x = d3
            .scaleLinear()
            .domain([-1, color.range().length - 1])
            .rangeRound([marginLeft, width - marginRight]);

        svg.append("g")
            .selectAll("rect")
            .data(color.range())
            .join("rect")
            .attr("x", (d, i) => x(i - 1))
            .attr("y", marginTop)
            .attr("width", (d, i) => x(i) - x(i - 1))
            .attr("height", height - marginTop - marginBottom)
            .attr("fill", (d) => d);

        tickValues = d3.range(thresholds.length);
        tickFormat = (i) => thresholdFormat(thresholds[i], i);
    }

    // Ordinal
    else {
        x = d3
            .scaleBand()
            .domain(color.domain())
            .rangeRound([marginLeft, width - marginRight]);

        svg.append("g")
            .selectAll("rect")
            .data(color.domain())
            .join("rect")
            .attr("x", x)
            .attr("y", marginTop)
            .attr("width", Math.max(0, x.bandwidth() - 1))
            .attr("height", height - marginTop - marginBottom)
            .attr("fill", color);

        tickAdjust = () => {};
    }

    svg.append("g")
        .attr("transform", `translate(0,${height - marginBottom})`)
        .attr("class", "legned-tick")
        .call(
            d3
                .axisBottom(x)
                .ticks(
                    ticks,
                    typeof tickFormat === "string" ? tickFormat : undefined
                )
                .tickFormat(
                    typeof tickFormat === "function" ? tickFormat : undefined
                )
                .tickSize(tickSize)
                .tickValues(tickValues)
        )
        .call(tickAdjust)
        .call((g) => g.select(".domain").remove())
        .call((g) =>
            g
                .append("text")
                .attr("x", marginLeft)
                .attr("y", marginTop + marginBottom - height - 6)
                .attr("fill", "currentColor")
                .attr("text-anchor", "start")
                .attr("font-weight", "bold")
                .attr("class", "legend-title")
                .text(title)
        );

    return svg.node();
}
