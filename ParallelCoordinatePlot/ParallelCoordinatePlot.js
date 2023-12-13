const width = 960;
const height = 500;
const margin = {
    top: height * 0.05,
    right: width * 0.01,
    bottom: height * 0.05,
    left: width * 0.1,
};
const innerWidth = width - margin.left - margin.right;
const innerHeight = height - margin.top - margin.bottom;

const columns = ["sepal length", "sepal width", "petal length", "petal width"];
const colorMap = {
    "Iris-setosa": "green",
    "Iris-versicolor": "red",
    "Iris-virginica": "blue",
};

const svg = d3.select("svg");
const g = svg
    .append("g")
    .attr("id", "graph")
    .attr("transform", `translate(${margin.left}, ${margin.top})`);

d3.csv("../data/iris.csv").then((data) => {
    // 定義 x 軸
    const x = d3.scalePoint().domain(columns).range([0, innerWidth]);

    // 定義 y 軸, 要有 4 條
    let y = {};
    let yAxis = {};
    for (let i in columns) {
        let name = columns[i];
        y[name] = d3
            .scaleLinear()
            .domain(d3.extent(data, (d) => d[name]))
            .range([innerHeight, 0]);

        yAxis[name] = d3.axisLeft().scale(y[name]);
    }
    console.log('yAxis is:', yAxis);

    // 畫上 y 軸的 g
    const yAxisG = g
        .selectAll("allAxis")
        .data(columns)
        .enter()
        .append("g") // 對於每筆資料(4 columns) add a 'g' element:
        .attr("class", "myAxis")
        .each((d, i, nodes) => {
            d3.select(nodes[i]).call(yAxis[d]);
        })
        .attr("transform", (d) => "translate(" + x(d) + ",0)");

    // 畫上 y 軸 Label
    yAxisG
        .append("text")
        .attr("class", "axis-label")
        .attr("fill", "black")
        .attr("y", 20)
        .attr("x", -20)
        .attr("text-anchor", "right")
        .text((d) => d);

    // The path function take a row of the csv as input, and return x and y coordinates of the line to draw for this row.
    const drawPath = (dataRow) => {
        return d3.line()(
            columns.map((point) => {
                return [x(point), y[point](dataRow[point])];
            })
        );
    };

    // 畫線
    svg.selectAll("myPath")
        .data(data)
        .join("path")
        .attr("d", drawPath)
        .attr("transform", `translate(${margin.left}, ${margin.top})`)
        .style("fill", "none")
        .style("stroke", (d) => `${colorMap[d["class"]]}`)
        .style("opacity", 0.5);
});
