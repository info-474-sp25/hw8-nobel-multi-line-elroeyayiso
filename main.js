// 1: SET GLOBAL VARIABLES
const margin = { top: 50, right: 30, bottom: 60, left: 70 };
const width = 800 - margin.left - margin.right;
const height = 400 - margin.top - margin.bottom;

// Create the SVG container and group element for the chart
const svgLine = d3.select("#lineChart")
    .append("svg")
    .attr("width", width + margin.left + margin.right)
    .attr("height", height + margin.top + margin.bottom)
    .append("g")
    .attr("transform", `translate(${margin.left},${margin.top})`);

// 2: LOAD DATA
d3.csv("nobel_laureates.csv").then(data => {

    // 2.a: REFORMAT DATA
    data.forEach(d => {
        d.year = +d.year;
        d.name = d.fullname;
    });

    // 3.a: Categorize data into STEM and Non-STEM
    const stemCategories = ["physics", "chemistry", "medicine", "economic sciences"];
    const categorizedData = data.map(d => ({
        ...d,
        categoryGroup: stemCategories.includes(d.category.toLowerCase()) ? "STEM" : "Non-STEM"
    }));

    // 3.b: Group data by categoryGroup and year, and count entries
    const categories = d3.rollup(
        categorizedData,
        v => d3.rollup(v, values => values.length, d => d.year),
        d => d.categoryGroup
    );

    // Convert nested data into flat structure for plotting
    const dataArray = Array.from(categories, ([key, yearMap]) => ({
        group: key,
        values: Array.from(yearMap, ([year, count]) => ({ year, count }))
    }));

    // 4: SET SCALES
    const allYears = Array.from(new Set(data.map(d => d.year)));
    const maxCount = d3.max(dataArray, d => d3.max(d.values, v => v.count));

    const xScale = d3.scaleLinear()
        .domain(d3.extent(allYears))
        .range([0, width]);

    const yScale = d3.scaleLinear()
        .domain([0, maxCount])
        .range([height, 0]);

    const colorScale = d3.scaleOrdinal()
        .domain(["STEM", "Non-STEM"])
        .range(d3.schemeCategory10);

    // 5: PLOT LINES
    const line = d3.line()
        .x(d => xScale(d.year))
        .y(d => yScale(d.count));

    svgLine.selectAll(".line")
        .data(dataArray)
        .enter()
        .append("path")
        .attr("class", "line")
        .attr("d", d => line(d.values))
        .style("stroke", d => colorScale(d.group))
        .style("fill", "none")
        .style("stroke-width", 2);

    // 6: ADD AXES
    svgLine.append("g")
        .attr("transform", `translate(0,${height})`)
        .call(d3.axisBottom(xScale).tickFormat(d3.format("d")));

    svgLine.append("g")
        .call(d3.axisLeft(yScale));

    // 7: ADD LABELS
    svgLine.append("text")
        .attr("x", width / 2)
        .attr("y", -20)
        .attr("text-anchor", "middle")
        .attr("class", "title")
        .text("Nobel Laureates Over Time: STEM vs Non-STEM");

    svgLine.append("text")
        .attr("x", width / 2)
        .attr("y", height + 40)
        .attr("text-anchor", "middle")
        .text("Year");

    svgLine.append("text")
        .attr("transform", "rotate(-90)")
        .attr("x", -height / 2)
        .attr("y", -50)
        .attr("text-anchor", "middle")
        .text("Number of Laureates");

    // 8: LEGEND
    const legend = svgLine.selectAll(".legend")
        .data(["STEM", "Non-STEM"])
        .enter()
        .append("g")
        .attr("class", "legend")
        .attr("transform", (d, i) => `translate(0, ${i * 20 - 40})`);

    legend.append("rect")
        .attr("x", width - 140)
        .attr("width", 12)
        .attr("height", 12)
        .style("fill", d => colorScale(d));

    legend.append("text")
        .attr("x", width - 120)
        .attr("y", 10)
        .attr("text-anchor", "start")
        .style("alignment-baseline", "middle")
        .text(d => d);
});
