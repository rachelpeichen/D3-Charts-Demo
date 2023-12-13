const width = 800;
const height = 600;
const margin = { top: 50, right: 20, bottom: 80, left: 100 };
const graphInnerWidth = width - margin.left - margin.right;
const graphInnerHeight = height - margin.top - margin.bottom;

const render = (data, xAttr, yAttr) => {
    const svg = d3
        .select("#scatter-plot-container")
        .append("svg")
        .attr("id", "scatter-plot")
        .attr("width", width)
        .attr("height", height)
        .append("g");

    svg.append("text")
        .attr("class", "title")
        .attr("x", graphInnerWidth / 2)
        .attr("y", 20)
        .attr("fill", "black")
        .text("Scatter Plot")
        .style("font-size", "20px")
        .style("font-weight", "bold");

    const xValue = (d) => d[xAttr];
    const yValue = (d) => d[yAttr];

    const xScale = d3
        .scaleLinear()
        .domain(d3.extent(data, (d) => d[xAttr]))
        .range([0, graphInnerWidth]);

    const yScale = d3
        .scaleLinear()
        .domain(d3.extent(data, (d) => d[yAttr]))
        .range([graphInnerHeight, 0]);

    const xAxisGroup = svg
        .append("g")
        .attr(
            "transform",
            `translate(${margin.left}, ${height - margin.bottom})`
        )
        .attr("class", "x-axis-group")
        .call(d3.axisBottom(xScale));

    xAxisGroup
        .append("text")
        .attr("x", graphInnerWidth / 2)
        .attr("y", 50)
        .attr("fill", "black")
        .text(xAttr)
        .style("font-size", "12px")
        .style("font-weight", "bold");

    svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`)
        .attr("class", "y-axis-group")
        .call(d3.axisLeft(yScale));

    svg.append("text")
        .attr("fill", "black")
        .attr("transform", `translate(0, ${height / 2})`)
        .text(yAttr)
        .style("font-size", "12px")
        .style("font-weight", "bold");

    svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`)
        .attr("id", "dots")
        .selectAll("dot")
        .data(data)
        .enter()
        .append("circle")
        .attr("class", "myCircle")
        .attr("cx", (d) => xScale(xValue(d)))
        .attr("cy", (d) => yScale(yValue(d)))
        .attr("r", 2)
        .style("fill", (d) => {
            switch (d.class) {
                case "Iris-setosa":
                    return "red";
                case "Iris-versicolor":
                    return "green";
                case "Iris-virginica":
                    return "blue";
                default:
                    return "magneta";
            }
        });
};

d3.csv("../data/iris.csv").then((data) => {
    let xAxisAttribute = document.querySelector("#x-axis-attribute");
    let yAxisAttribute = document.querySelector("#y-axis-attribute");

    xAxisAttribute.addEventListener("change", (_event) => {
        d3.select("#scatter-plot").remove();
        render(
            data,
            xAxisAttribute[xAxisAttribute.selectedIndex].value,
            yAxisAttribute[yAxisAttribute.selectedIndex].value
        );
    });

    yAxisAttribute.addEventListener("change", (_event) => {
        d3.select("#scatter-plot").remove();
        render(
            data,
            xAxisAttribute[xAxisAttribute.selectedIndex].value,
            yAxisAttribute[yAxisAttribute.selectedIndex].value
        );
    });

    render(data, "sepal length", "sepal width");
});
