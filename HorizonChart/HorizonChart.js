const width = 960;
const padding = 1;
const overlap = 4;
const size = 50; // the height of each sub chart
const margin = {
    top: 20,
    right: 20,
    bottom: 50,
    left: 20,
};
const graphInnerWidth = width - margin.left - margin.right;
const colors = d3.schemeSet3;

// Helper methods
const filterYear = (rawDataArray, selectedYear) => {
    const result = rawDataArray.filter((d) => {
        const fullDateHourString = d["Measurement date"]; // 2017-01-01 00:00
        const dateStr = fullDateHourString.split(" ", 1)[0]; // 2017-01-01
        const yearStr = dateStr.split("-")[0]; // 2017
        return yearStr == selectedYear;
    });
    return result;
};

const addTimeStationKey = (item) => {
    // Add unique key (date+station,  code): 2017-01-01#101
    const fullDateHourString = item["Measurement date"]; // 2017-01-01 00:00
    const dateStr = fullDateHourString.split(" ", 1)[0]; // 2017-01-01
    const dateAndStation = dateStr + "#" + item["Station code"]; // 2017-01-01#101

    return {
        timeStationKey: dateAndStation, // 2017-01-01#101 use time+station as sepecial key to calculate daily average for each station(line 32)
        onlyDateStr: dateStr,
        address: item.address,
        SO2: +item.SO2,
        NO2: +item.NO2,
        O3: +item.O3,
        CO: +item.CO,
        PM10: +item.PM10,
        PM25: +item["PM2.5"],
    };
};

const calculateDailyAverage = (dataArray) => {
    // 把小時資料整理成每日一筆，每個 Station 當日各項污染物的平均濃度
    let sumMap = new Map(); // 用來儲存污染物的濃度總和 key: 2017-01-01#101, value: { SO2: ..., NO2: ...,}
    let countMap = new Map(); // 用來儲存該日該地點有幾筆 key: 2017-01-01#101, value: count
    let result = [];

    dataArray.forEach(function (item) {
        const key = item.timeStationKey;

        // 如果此時間地點(timeStationKey)還沒出現過，加入map中
        if (!sumMap.has(key)) {
            sumMap.set(key, { SO2: 0, NO2: 0, O3: 0, CO: 0, PM10: 0, PM25: 0 });
            countMap.set(key, 0);
        }

        // sumMap 累加各項污染物濃度
        sumMap.get(key).SO2 += item.SO2;
        sumMap.get(key).NO2 += item.NO2;
        sumMap.get(key).O3 += item.O3;
        sumMap.get(key).CO += item.CO;
        sumMap.get(key).PM10 += item.PM10;
        sumMap.get(key).PM25 += item.PM25;

        // countMap 累加資料筆數
        countMap.set(key, countMap.get(key) + 1);
    });

    // loop sumMap 用時間地點(timeStationKey) 去 countMap 找該 timeStationKey有幾筆資料來算平均
    sumMap.forEach(function (sum, key) {
        const date = key.split("#")[0];
        const stationCode = key.split("#")[1];
        const count = countMap.get(key);
        const avgSO2 = sum.SO2 / count;
        const avgNO2 = sum.NO2 / count;
        const avgO3 = sum.O3 / count;
        const avgCO = sum.CO / count;
        const avgPM10 = sum.PM10 / count;
        const avgPM25 = sum.PM25 / count;
        result.push({
            timeStationKey: key,
            date: new Date(date),
            stationCode: stationCode,
            avgSO2: avgSO2,
            avgNO2: avgNO2,
            avgO3: avgO3,
            avgCO: avgCO,
            avgPM10: avgPM10,
            avgPM25: avgPM25,
        });
    });

    return result;
};

// use this format to draw chart
const groupDataByStationAndPollutant = (dataArray) => {
    let tmp = [];
    let stationAndPollutantObj = {};

    dataArray.forEach(function (item) {
        let stationCode = item.stationCode;

        // Iterate through pollutant fields {"avgCO", "avgNO2"...}
        for (const key in item) {
            if (
                key !== "stationCode" &&
                key !== "date" &&
                key !== "timeStationKey"
            ) {
                const stationPollutantKey = stationCode + "_" + key;

                if (!stationAndPollutantObj[stationPollutantKey]) {
                    stationAndPollutantObj[stationPollutantKey] = {
                        stationPollutantKey: stationPollutantKey,
                        values: [],
                    };
                }

                stationAndPollutantObj[stationPollutantKey].values.push({
                    date: item.date,
                    avg: item[key],
                    pollutant: key.split("avg")[1],
                });
            }
        }
    });

    for (const key in stationAndPollutantObj) {
        tmp.push(stationAndPollutantObj[key]);
    }

    return tmp;
};

// use formatted data to calculate y domain
const formatData = (dataArray) => {
    const formattedResult = [];
    dataArray.forEach((item) => {
        item.values.forEach((value) => {
            const station = item.stationPollutantKey.split("_")[0];
            const pollutant = item.stationPollutantKey
                .split("_")[1]
                .split("avg")[1];
            formattedResult.push({
                name: item.stationPollutantKey,
                date: value.date,
                value: value.avg,
                station: station,
                pollutant: pollutant,
            });
        });
    });
    return formattedResult;
};

const calculateYdomain = (formattedDataArray) => {
    const reducedResult = formattedDataArray.reduce((acc, data) => {
        const { pollutant, value } = data;
        if (!acc[pollutant]) {
            acc[pollutant] = { max: value, min: value };
        } else {
            acc[pollutant].max = Math.max(acc[pollutant].max, value);
            acc[pollutant].min = Math.min(acc[pollutant].min, value);
        }
        return acc;
    }, {});
    return reducedResult;
};

const formatPollutantString = (pollutant) => {
    switch (pollutant) {
        case "SO2":
            return "SO₂";
        case "NO2":
            return "NO₂";
        case "CO":
            return "CO";
        case "O3":
            return "O₃";
        case "PM10":
            return "PM₁₀";
        case "PM25":
            return "PM₂.₅";
        default:
            break;
    }
};

// Below 3 methods refer to Observablehq DOM Library
let count = 0;

function uid(name) {
    return new Id("O-" + (name == null ? "" : name + "-") + ++count);
}

function Id(id) {
    this.id = id;
    this.href = new URL(`#${id}`, location) + "";
}

Id.prototype.toString = function () {
    return "url(" + this.href + ")";
};


const render = (dataByStationAndPollutant, yDomain, displayYear) => {
    // Hieght of the overall chart depends on each sub horizon chart
    const height =
        dataByStationAndPollutant.length * (size + 1) +
        margin.top +
        margin.bottom;

    const svg = d3
        .select(".chart-container")
        .append("svg")
        .attr("id", "graph")
        .attr("transform", `translate(${margin.left}, ${margin.top})`)
        .attr("width", width)
        .attr("height", height)
        .attr("viewBox", [0, 0, width, height])
        .attr("style", "max-width: 100%; height: auto; font: 14px sans-serif;");

    const startDate = new Date(`${displayYear}-01-01`);
    const endDate = new Date(`${displayYear}-12-31`);

    const x = d3
        .scaleUtc()
        .domain([startDate, endDate])
        .range([0, graphInnerWidth]);

    svg.append("g")
        .attr("transform", `translate(${margin.left}, ${margin.top})`)
        .attr("id", "x-axis-group")
        .attr("style", "font: 14px sans-serif;")
        .call(d3.axisTop(x).tickSizeInner(5))
        .call((g) => g.select(".domain").remove());

    // Different y domain for differnet pollutant
    const ySO2 = d3
        .scaleLinear()
        .domain([yDomain.SO2.min, yDomain.SO2.max])
        .range([size, size - overlap * (size - 1)]);
    const yNO2 = d3
        .scaleLinear()
        .domain([yDomain.NO2.min, yDomain.NO2.max])
        .range([size, size - overlap * (size - 1)]);
    const yCO = d3
        .scaleLinear()
        .domain([yDomain.CO.min, yDomain.CO.max])
        .range([size, size - overlap * (size - 1)]);
    const yO3 = d3
        .scaleLinear()
        .domain([yDomain.O3.min, yDomain.O3.max])
        .range([size, size - overlap * (size - 1)]);
    const yPM10 = d3
        .scaleLinear()
        .domain([yDomain.PM10.min, yDomain.PM10.max])
        .range([size, size - overlap * (size - 1)]);
    const yPM25 = d3
        .scaleLinear()
        .domain([yDomain.PM25.min, yDomain.PM25.max])
        .range([size, size - overlap * (size - 1)]);

    // Define colored area
    const area = d3
        .area(d3.curveStep)
        .defined((d) => !isNaN(d.avg))
        .x((d) => x(d.date))
        .y0((d) => {
            switch (d.pollutant) {
                case "SO2":
                    return ySO2(0);
                case "NO2":
                    return yNO2(0);
                case "CO":
                    return yCO(0);
                case "O3":
                    return yO3(0);
                case "PM10":
                    return yPM10(0);
                case "PM25":
                    return yPM25(0);
                default:
                    break;
            }
        })
        .y1((d) => {
            switch (d.pollutant) {
                case "SO2":
                    return ySO2(d.avg);
                case "NO2":
                    return yNO2(d.avg);
                case "CO":
                    return yCO(d.avg);
                case "O3":
                    return yO3(d.avg);
                case "PM10":
                    return yPM10(d.avg);
                case "PM25":
                    return yPM25(d.avg);
                default:
                    break;
            }
        });

    const tooltip = d3
        .select("body")
        .append("div")
        .attr("class", "tooltip")
        .attr("style", "position: absolute; opacity: 0; font-size: 12px;");

    const mouseover = function (_d) {
        tooltip.style("opacity", 1.0);
        d3.select(this).style("opacity", 0.3);
    };

    const mousemove = function (event, d, i) {
        const p = formatPollutantString(d.values[0].pollutant);
        tooltip
            .html(d.stationPollutantKey.split("_")[0] + " / " + p)
            .style("top", event.pageY - 20 + "px")
            .style("left", event.pageX + 20 + "px");
    };

    const mouseleave = function (_d) {
        tooltip.style("opacity", 0);
        d3.select(this).style("opacity", 1);
    };

    const g = svg
        .append("g")
        .attr("id", "pollutant-and-site-group")
        .selectAll("g")
        .data(dataByStationAndPollutant)
        .enter()
        .append("g")
        .attr("class", "pollutant-and-site")
        .attr(
            "transform",
            (_d, i) => `translate(0, ${i * (size + 1) + margin.top})`
        );

    g.append("clipPath")
        .attr("id", (d) => (d.clip = uid("clip")).id)
        .append("rect")
        .attr("y", padding)
        .attr("width", width)
        .attr("height", size - padding);

    g.append("defs")
        .append("path")
        .attr("id", (d) => (d.path = uid("path")).id)
        .attr("d", (d) => area(d.values));

    g.append("g")
        .attr("clip-path", (d) => d.clip)
        .selectAll("use")
        .data((d) =>
            Array.from({ length: overlap * 2 }, (_, i) =>
                Object.assign({ index: i < overlap ? -i - 1 : i - overlap }, d)
            )
        )
        .enter()
        .append("use")
        .attr("fill", (d, _i) => colors[d.index + Math.max(3, overlap)])
        .attr("transform", (d) => `translate(0, ${(d.index + 1) * size})`)
        .attr("xlink:href", (d) => d.path.href)
        .on("mouseover", mouseover)
        .on("mousemove", mousemove)
        .on("mouseleave", mouseleave);

    g.append("text")
        .attr("x", 0)
        .attr("y", size / 2)
        .attr("dy", "0.35em")
        .text(
            (d) => {
                const p = formatPollutantString(d.values[0].pollutant);
                return `${d.stationPollutantKey.split("_")[0]} [${
                    p
                }]`
            }
        );
};

d3.csv("HorizonChartData.csv").then((data) => {
    let yearElement = document.querySelector("#year-key");
    yearElement.addEventListener("change", (_event) => {
        let selectedYear = yearElement[yearElement.selectedIndex].value;
        d3.select("#graph").remove();

        const selectedYearData = filterYear(data, selectedYear);
        const addTimeStationKeyData = selectedYearData.map((d) =>
            addTimeStationKey(d)
        );
        const dataByDailyAverage = calculateDailyAverage(addTimeStationKeyData);
        const dataByStationAndPollutant =
            groupDataByStationAndPollutant(dataByDailyAverage);
        const formattedData = formatData(dataByStationAndPollutant);
        const yDomainObj = calculateYdomain(formattedData);

        render(dataByStationAndPollutant, yDomainObj, selectedYear);
    });

    // default shows 2017
    const defaultYearData = filterYear(data, "2017");
    const addTimeStationKeyDataDefault = defaultYearData.map((d) =>
        addTimeStationKey(d)
    );
    const dataByDailyAverageDefault = calculateDailyAverage(
        addTimeStationKeyDataDefault
    );
    const dataByStationAndPollutantDefault = groupDataByStationAndPollutant(
        dataByDailyAverageDefault
    );
    const formattedDataDefault = formatData(dataByStationAndPollutantDefault);
    const yDomainObjDefault = calculateYdomain(formattedDataDefault);
    render(dataByStationAndPollutantDefault, yDomainObjDefault, "2017");
});
