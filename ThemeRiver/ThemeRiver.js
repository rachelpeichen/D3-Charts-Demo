const width = 960;
const height = 960;
const margin = {
    top: 30,
    right: 100,
    bottom: 100,
    left: 30,
};
const graphInnerWidth = width - margin.left - margin.right;
const graphInnerHeight = height - margin.top - margin.bottom;
const myKeys = [
    "house2",
    "house3",
    "house4",
    "house5",
    "unit1",
    "unit2",
    "unit3",
];

// Helper methods
const formatData = (item) => {
    // format saledate from string to "Date" type
    const splitDate = item.saledate.split("/");
    const tmpDate = splitDate[1] + "/" + splitDate[0] + "/" + splitDate[2];
    const formattedDate = new Date(tmpDate);
    // add myKey(type + bedrooms)
    const myKey = item.type + item.bedrooms;
    return {
        format_saledate: formattedDate,
        MA_num: +item.MA,
        my_key: myKey,
    };
};

const render = (data, orderArray) => {
    console.log(orderArray);
    const svg = d3.select("svg");
    const g = svg
        .append("g")
        .attr("id", "graph")
        .attr("transform", `translate(${margin.left}, ${margin.top})`);

    const color = d3.scaleOrdinal().domain(myKeys).range(d3.schemeSet3);

    const series = d3
        .stack()
        .order(orderArray)
        .offset(d3.stackOffsetSilhouette)
        .keys(myKeys);
    const stackedData = series(data);

    const x = d3
        .scaleTime()
        .domain(d3.extent(data, (d) => d.saleDate))
        .range([margin.left, graphInnerWidth]);

    g.append("g")
        .attr("transform", `translate(0, ${height - margin.bottom})`)
        .attr("id", "x-axis-group")
        .call(d3.axisBottom(x).tickSize(10).tickPadding(10))
        .call((g) => g.select(".domain").remove());

    const y = d3
        .scaleLinear()
        .domain([-3000000, 3000000])
        .range([graphInnerHeight, 0]);

    g.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`)
        .call(d3.axisLeft(y).ticks(7).tickSize(0).tickPadding(10))
        .call((g) =>
            g
                .selectAll(".tick line")
                .clone()
                .attr("x2", width - margin.left - margin.right)
                .attr("stroke-opacity", 0.3)
        )
        .call((d) => d.select(".domain").remove());

    const tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "tooltip")
        .attr("style", "position: absolute; opacity: 0;");

    const mouseover = function (event, d) {
        tooltip.style("opacity", 1);
        d3.selectAll(".stacked_area").style("opacity", 0.2);
        d3.select(this).style("opacity", 1);
    };

    const mousemove = function (event, d, i) {
        tooltip
                .html(d.key)
                .style("top", event.pageY - 20 + "px")
                .style("left", event.pageX + 20 + "px");
    };

    const mouseleave = function (event, d) {
        tooltip.style("opacity", 0);
        d3.selectAll(".stacked_area")
            .style("opacity", 1)
            .style("stroke", "none");
    };

    g.append("g")
        .attr("id", "whole_stack_areas_chart")
        .selectAll("allStackedAreas")
        .data(stackedData)
        .enter()
        .append("path")
        .attr("class", "stacked_area")
        .style("fill", (d) => color(d.key))
        .attr(
            "d",
            d3
                .area()
                .x(function (d, i) {
                    return x(d.data.saleDate);
                })
                .y0(function (d) {
                    return y(d[0]);
                })
                .y1(function (d) {
                    return y(d[1]);
                })
        )
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);
};

d3.csv("ThemeRiverData.csv").then((data) => {
    const formattedData = data.map((d) => formatData(d));

    // sort data by saledate
    let uniqueDateObj = {};
    for (const d of formattedData) {
        if (!(d.format_saledate in uniqueDateObj)) {
            uniqueDateObj[d.format_saledate] = {};
        }
        uniqueDateObj[d.format_saledate][d.my_key] = d.MA_num;
    }

    // replace nan with 0
    for (const date in uniqueDateObj) {
        for (const k of myKeys) {
            if (!(k in uniqueDateObj[date])) {
                uniqueDateObj[date][k] = 0;
            }
        }
    }

    const renderData = [];
    for (const key in uniqueDateObj) {
        let tmp = {
            saleDate: new Date(key),
            ...uniqueDateObj[key],
        };
        renderData.push(tmp);
    }

    renderData.sort((a, b) => {
        return new Date(a.saleDate) - new Date(b.saleDate);
    });

    // Simple list
    const el = document.getElementById("list");
    Sortable.create(el, {
        animation: 150,
        ghostClass: 'blue-background-class'
    });

    const orderArray = [6, 5, 4, 3, 2, 1, 0]; // d3 drawing starts from bottom so the order is myKeys reversed
    el.onchange = (e)=> {
        let orders = [];
        for (let index = 0; index < e.target.children.length; index++){
            // e.target.children[index].innerText -> house2
            console.log(e.target.children[index].innerText);
            orders.push(myKeys.indexOf(e.target.children[index].innerText)); // get the order of house2 in children
        }
        orders.reverse(); // reversed back to see the correct order
        d3.select("#graph").remove();
        render(renderData, orders);
    }
    render(renderData, orderArray);
});
