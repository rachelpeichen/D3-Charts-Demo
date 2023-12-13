const width = 960;
const height = 960;
const padding = 28;
const columns = ["sepal length", "sepal width", "petal length", "petal width"];
const size =
    (width - (columns.length + 1) * padding) / columns.length + padding;
const colorMap = {
    "Iris-setosa": "#d7ab6c",
    "Iris-versicolor": "#e58b8b",
    "Iris-virginica": "#53c5ce",
};
const svg = d3.select("svg");

const brush = (cell, circle, svg, { padding, size, x, y, columns }) => {
    const brush = d3
        .brush()
        .extent([
            [padding / 2, padding / 2],
            [size - padding / 2, size - padding / 2],
        ])
        .on("start", brushstarted)
        .on("brush", brushed)
        .on("end", brushended);

    cell.call(brush);

    let brushCell;

    // clear if poins are brushed
    function brushstarted() {
        if (brushCell !== this) {
            d3.select(brushCell).call(brush.move, null);
            brushCell = this;
        }
    }

    // Highlight brushed points
    function brushed({ selection }, [i, j]) {
        let selected = [];
        if (selection) {
            const [[x0, y0], [x1, y1]] = selection;
            circle.classed(
                "hidden",
                (d) =>
                    x0 > x[i](d[columns[i]]) ||
                    x1 < x[i](d[columns[i]]) ||
                    y0 > y[j](d[columns[j]]) ||
                    y1 < y[j](d[columns[j]])
            );
            selected = data.filter(
                (d) =>
                    x0 < x[i](d[columns[i]]) &&
                    x1 > x[i](d[columns[i]]) &&
                    y0 < y[j](d[columns[j]]) &&
                    y1 > y[j](d[columns[j]])
            );
        }
        svg.property("value", selected).dispatch("input");
    }

    // If not brushed, select all them
    function brushended({ selection }) {
        if (selection) return;
        svg.property("value", []).dispatch("input");
        circle.classed("hidden", false);
    }
}

const render = (data) => {
    const x = columns.map((column) =>
        d3
            .scaleLinear()
            .domain(d3.extent(data, (d) => d[column]))
            .rangeRound([padding / 2, size - padding / 2])
    );
    const y = x.map((x) => x.copy().range([size - padding / 2, padding / 2]));

    const axisx = d3
        .axisBottom()
        .ticks(6)
        .tickSize(size * columns.length);
    const xAxis = (g) =>
        g
            .selectAll("g")
            .data(x)
            .join("g")
            .attr("transform", (d, i) => `translate(${i * size},0)`)
            .each(function (d) {
                return d3.select(this).call(axisx.scale(d));
            })
            .call((g) => g.select(".domain").remove())
            .call((g) => g.selectAll(".tick line").attr("stroke", "#ddd"));

    const axisy = d3
        .axisLeft()
        .ticks(6)
        .tickSize(-size * columns.length);
    const yAxis = (g) =>
        g
            .selectAll("g")
            .data(y)
            .join("g")
            .attr("transform", (d, i) => `translate(0,${i * size})`)
            .each(function (d) {
                return d3.select(this).call(axisy.scale(d));
            })
            .call((g) => g.select(".domain").remove())
            .call((g) => g.selectAll(".tick line").attr("stroke", "#ddd"));

    svg.attr("viewBox", [-padding, 0, width, height])
        .append("style")
        .text(`circle.hidden { fill: #000; fill-opacity: 1; r: 1px; }`);

    svg.append("g").call(xAxis);

    svg.append("g").call(yAxis);

    const cell = svg
        .append("g")
        .selectAll("cell")
        .data(d3.cross(d3.range(columns.length), d3.range(columns.length)))
        .join("g")
        .attr("transform", ([i, j]) => `translate(${i * size},${j * size})`);

    cell.append("rect")
        .attr("fill", "none")
        .attr("stroke", "#aaa")
        .attr("x", padding / 2 + 0.5)
        .attr("y", padding / 2 + 0.5)
        .attr("width", size - padding)
        .attr("height", size - padding);

    cell.each(function ([i, j]) {
        if (i == j) {
            // draw histogram when x y attributes the same
            const values = data.map(function (d) {
                return +d[columns[i]];
            });
            const xHist = d3
                .scaleLinear()
                .domain([d3.min(values), d3.max(values)])
                .range([padding / 2, size - padding / 2]);

            const histogram = d3
                .bin()
                .domain(xHist.domain())
                .thresholds(xHist.ticks(10))(values);

            const yHist = d3
                .scaleLinear()
                .domain([
                    0,
                    d3.max(histogram, function (d) {
                        return d.length;
                    }),
                ])
                .range([size - padding / 2, padding / 2]);

            d3.select(this)
                .selectAll("bar")
                .data(histogram)
                .enter()
                .append("rect")
                .attr("class", "bar")
                .attr("x", function (d) {
                    return xHist(d.x0);
                })
                .attr("y", function (d) {
                    return yHist(d.length);
                })
                .attr(
                    "width",
                    xHist(histogram[0].x1) - xHist(histogram[0].x0) - 1
                )
                .attr("height", (d) => size - padding / 2 - yHist(d.length))
                .style("fill", "#b3c5a2")
                .style("opacity", 0.7);
        } else {
            d3.select(this)
                .selectAll("circle")
                .data(
                    data.filter(
                        (d) => !isNaN(d[columns[i]]) && !isNaN(d[columns[j]])
                    )
                )
                .join("circle")
                .attr("cx", (d) => x[i](d[columns[i]]))
                .attr("cy", (d) => y[j](d[columns[j]]));
        }

        svg.append("g")
            .style("font", "12px sans-serif")
            .style("pointer-events", "none")
            .selectAll("text")
            .data(columns)
            .join("text")
            .attr("transform", (d, i) => `translate(${i * size},${i * size})`)
            .attr("x", padding)
            .attr("y", padding)
            .text((d) => d);
    });

    const circle = cell
        .selectAll("circle")
        .attr("r", 3.5)
        .attr("fill-opacity", 0.7)
        .attr("fill", (d) => `${colorMap[d["class"]]}`);

    cell.call(brush, circle, svg, { padding, size, x, y, columns });
};

d3.csv("../data/iris.csv").then((data) => {
    render(data);
});
