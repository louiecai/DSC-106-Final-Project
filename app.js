function final_project() {
    var filePath = "data/final_output.csv";
    plot1(filePath);
    plot2(filePath);
    plot3(filePath);
    plot4(filePath);
    plot5(filePath);
}

var plot1 = function (filePath) {
    d3.csv(filePath).then(function (data) {
        // make a scatter plot between guest_satisfaction_overall and cleanliness_rating
        const WIDTH = 1500;
        const HEIGHT = 900;
        const MARGIN = 120;

        // get all the cities
        const CITIES = [...new Set(data.map(d => d.city))];
        var datasets = {};
        for (var i = 0; i < CITIES.length; i++) {
            datasets[CITIES[i]] = data.filter(d => d.city == CITIES[i]);
            datasets[CITIES[i] + "xScale"] = d3.scaleLinear().domain([0, d3.max(datasets[CITIES[i]], d => parseFloat(d.dist)) * 1.05]).range([MARGIN, WIDTH - MARGIN]);
            datasets[CITIES[i] + "yScale"] = d3.scaleLinear().domain([0, d3.max(datasets[CITIES[i]], d => parseFloat(d.realSum)) * 1.05]).range([HEIGHT - MARGIN, MARGIN]);
        }

        // add options to the drop down menu
        d3.select("#q1_button").selectAll("option").data(CITIES).enter().append("option").attr("value", d => d).text(d => d[0].toUpperCase() + d.slice(1));

        // zooming
        var zoom = d3.zoom().scaleExtent([0.75, 25]).on("zoom", zoom);

        // svg
        var svg = d3.select("#q1_plot").append("svg").attr("width", WIDTH).attr("height", HEIGHT).call(zoom);

        var clip = svg.append("defs").append("svg:clipPath").attr("id", "clip").append("svg:rect").attr("width", WIDTH - 2 * MARGIN).attr("height", HEIGHT - 2 * MARGIN).attr("x", MARGIN).attr("y", MARGIN);

        var points = svg.append("g").attr("clip-path", "url(#clip)");

        // have the yaxis show e^value rather than the value
        var xAxis = svg.append("g").attr("transform", "translate(0," + (HEIGHT - MARGIN) + ")").call(d3.axisBottom(datasets["rome" + "xScale"]));
        var yAxis = svg.append("g").attr("transform", "translate(" + MARGIN + ",0)").call(d3.axisLeft(datasets["rome" + "yScale"]))
        // yAxis.selectAll("text").text(d => Math.round(Math.exp(d) * 100) / 100);

        // create color based on the city
        var colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(data.map(d => d.city));

        var title = svg.append("text").attr("x", WIDTH / 2).attr("y", MARGIN / 2).attr("text-anchor", "middle").attr("font-size", "24px").text("Airbnb Price vs Distance from City Center").style("font-weight", "bold");

        var xAxisLabel = svg.append("text").attr("x", WIDTH / 2).attr("y", HEIGHT - MARGIN / 2).attr("text-anchor", "middle").attr("font-size", "16px").text("Distance from City Center (km)");
        var yAxisLabel = svg.append("text").attr("x", -HEIGHT / 2).attr("y", MARGIN / 2).attr("text-anchor", "middle").attr("font-size", "16px").text("Price (€)").attr("transform", "rotate(-90)");


        function zoom(event) {
            const { transform } = event;
            const new_xScale = transform.rescaleX(datasets[d3.select("#q1_button").property("value") + "xScale"]);
            const new_yScale = transform.rescaleY(datasets[d3.select("#q1_button").property("value") + "yScale"]);

            xAxis.call(d3.axisBottom(new_xScale));
            yAxis.call(d3.axisLeft(new_yScale));//.selectAll("text").text(d => Math.round(Math.exp(d) * 100) / 100);

            svg.selectAll("circle").attr("cx", d => new_xScale(parseFloat(d.dist))).attr("cy", d => new_yScale(parseFloat(d.realSum)));
        }

        function update_plot() {
            let current_data = datasets[d3.select("#q1_button").property("value")];
            let xScale = datasets[d3.select("#q1_button").property("value") + "xScale"];
            let yScale = datasets[d3.select("#q1_button").property("value") + "yScale"];
            xAxis.transition().duration(1000).call(d3.axisBottom(xScale));
            yAxis.transition().duration(1000).call(d3.axisLeft(yScale)); //.selectAll("text").text(d => Math.round(Math.exp(d) * 100) / 100);
            points.selectAll("circle").remove();
            points.selectAll("circle").data(current_data).enter().append("circle").attr("cx", d => xScale(parseFloat(d.dist))).attr("cy", d => yScale(parseFloat(d.realSum))).attr("r", 4).attr("fill", d => colorScale(d.city)).attr("opacity", 0.5)
            // enlarge the circles when the mouse is over them
            points.selectAll("circle").on("mouseover", function (d) {
                d3.select(this).transition().duration(200).attr("r", 15).attr("opacity", 1).attr("stroke", "black").attr("stroke-width", 4);
            }).on("mouseout", function (d) {
                d3.select(this).transition().duration(150).attr("r", 4).attr("opacity", 0.5).attr("stroke", "none");
            });


            // add the title
            title.text("Distance from City Center in " + d3.select("#q1_button").property("value")[0].toUpperCase() + d3.select("#q1_button").property("value").slice(1) + " vs The Total Price of the Listing");
        }
        update_plot();
        d3.select("#q1_button").on("change", update_plot);
    });
}

var plot2 = function (filePath) {
    d3.csv(filePath).then(function (data) {
        // create a horizontal bar plot that displays the average satisfaction rating for each city
        const WIDTH = 1200;
        const HEIGHT = 750;
        const MARGIN = 120;

        // get all the cities
        data = d3.rollup(data, v => [d3.mean(v, d => parseFloat(d.guest_satisfaction_overall)), d3.deviation(v, d => parseFloat(d.guest_satisfaction_overall))], d => d.city);
        data = d3.map(data, function (d) {
            return { city: d[0], mean_guest_satisfaction: d[1][0], std_guest_satisfaction: d[1][1] }
        });
        data.sort((a, b) => a.mean_guest_satisfaction - b.mean_guest_satisfaction);
        const CITIES = [...new Set(data.map(d => d.city))];

        // create the x and y scales
        var xScale = d3.scaleLinear().domain([0, 100]).range([MARGIN, WIDTH - MARGIN]);
        var yScale = d3.scaleBand().domain(CITIES).range([HEIGHT - MARGIN, MARGIN]).padding(0.1);

        // svg
        var svg = d3.select("#q2_plot").append("svg").attr("width", WIDTH).attr("height", HEIGHT);

        // create color based on the city
        var colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(data.map(d => d.city));

        var title = svg.append("text").attr("x", WIDTH / 2).attr("y", MARGIN / 2).attr("text-anchor", "middle").attr("font-size", "24px").text("Average Guest Satisfaction Rating for Each City").style("font-weight", "bold");

        var xAxis = svg.append("g").attr("transform", "translate(0," + (HEIGHT - MARGIN) + ")").call(d3.axisBottom(xScale)).selectAll("text").attr("font-size", "12.5px");
        var yAxis = svg.append("g").attr("transform", "translate(" + MARGIN + ",0)").call(d3.axisLeft(yScale)).selectAll("text").attr("font-size", "12.5px");
        yAxis.selectAll("text").text(d => d[0].toUpperCase() + d.slice(1)).attr("font-size", "12.5px");

        var xAxisLabel = svg.append("text").attr("x", WIDTH / 2).attr("y", HEIGHT - MARGIN / 2).attr("text-anchor", "middle").attr("font-size", "16px").text("Average Guest Satisfaction Rating");
        var yAxisLabel = svg.append("text").attr("x", -HEIGHT / 2).attr("y", MARGIN / 2).attr("text-anchor", "middle").attr("font-size", "16px").text("City").attr("transform", "rotate(-90)");

        var data = svg.selectAll("rect").data(data).enter().append("rect").attr("x", MARGIN).attr("y", d => yScale(d.city)).attr("width", d => xScale(d.mean_guest_satisfaction) - MARGIN).attr("height", yScale.bandwidth()).attr("fill", d => colorScale(d.city)).attr("id", "bar")

        // add a tooltip that moves with the mouse
        var tooltip = d3.select("#q2_plot").append("div").style("position", "absolute").style("visibility", "hidden").text("a simple tooltip");

        data.on("mouseover", function (d) {
            tooltip.style("visibility", "visible").text(Math.round(d.toElement.__data__.mean_guest_satisfaction * 100) / 100).select("text").attr("font-size", "16px");
        }).on("mousemove", function (d) { tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px"); }).on("mouseout", function (d) {
            tooltip.style("visibility", "hidden");
        });
    });
}

var plot3 = function (filePath) {
    d3.csv(filePath).then(function (data) {
        // vertical stacked bar plot
        // find the cleanliness rating for each city for each room type

        const WIDTH = 1500;
        const HEIGHT = 900;
        const MARGIN = 160;

        // get all the cities
        const CITIES = [...new Set(data.map(d => d.city))];
        const ROOM_TYPES = [...new Set(data.map(d => d.room_type))];
        data = d3.rollup(data, v => d3.mean(v, d => parseFloat(d.cleanliness_rating)), d => d.city, d => d.room_type);

        // flatten the data
        flattenedData = [];
        for (const [key, value] of data.entries()) {
            var current = { city: key }
            for (const [key2, value2] of value.entries()) {
                current[key2] = value2;
            }
            flattenedData.push(current);
        }
        // console.log(flattenedData)

        var svg = d3.select("#q3_plot").append("svg").attr("width", WIDTH).attr("height", HEIGHT);

        // create color based on the room type
        var colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(ROOM_TYPES);

        // VERTICAL BAR PLOT NOT HORIZONTAL
        var xScale = d3.scaleBand().domain(CITIES).range([MARGIN, WIDTH - MARGIN]).padding(0.1);
        var yScale = d3.scaleLinear().domain([0, 30]).range([HEIGHT - MARGIN, MARGIN]);

        var xAxis = svg.append("g").attr("transform", "translate(0," + (HEIGHT - MARGIN) + ")").call(d3.axisBottom(xScale)).selectAll("text").text(d => d[0].toUpperCase() + d.slice(1)).attr("font-size", "12.5px");
        var yAxis = svg.append("g").attr("transform", "translate(" + MARGIN + ",0)").call(d3.axisLeft(yScale)).selectAll("text").attr("font-size", "12.5px");

        var stackedData = d3.stack().keys(ROOM_TYPES)(flattenedData);
        // console.log(stackedData)

        var data = svg.append("g").selectAll("g").data(stackedData).enter().append("g").attr("fill", d => colorScale(d.key)).selectAll("rect").data(d => d).enter().append("rect").attr("x", d => xScale(d.data.city)).attr("y", d => yScale(d[1])).attr("height", d => yScale(d[0]) - yScale(d[1])).attr("width", xScale.bandwidth());

        // labels
        var title = svg.append("text").attr("x", WIDTH / 2).attr("y", MARGIN / 2).attr("text-anchor", "middle").attr("font-size", "24px").text("Average Cleanliness Rating for Each City").style("font-weight", "bold");
        var xAxisLabel = svg.append("text").attr("x", WIDTH / 2).attr("y", HEIGHT - MARGIN / 2).attr("text-anchor", "middle").attr("font-size", "16px").text("City");
        var yAxisLabel = svg.append("text").attr("x", -HEIGHT / 2).attr("y", MARGIN / 2).attr("text-anchor", "middle").attr("font-size", "16px").text("Average Cleanliness Rating").attr("transform", "rotate(-90)");

        // legend
        svg.append("g").selectAll("rect").data(ROOM_TYPES).enter().append("rect").attr("x", WIDTH - MARGIN).attr("y", (d, i) => MARGIN + i * 20).attr("width", 20).attr("height", 20).attr("fill", d => colorScale(d));
        svg.append("g").selectAll("text").data(ROOM_TYPES).enter().append("text").attr("x", WIDTH - MARGIN + 25).attr("y", (d, i) => MARGIN + i * 20 + 15).text(d => d).attr("font-size", "16px");

        // add a tooltip that moves with the mouse
        var tooltip = d3.select("#q2_plot").append("div").style("position", "absolute").style("visibility", "hidden").text("a simple tooltip");

        data.on("mouseover", function (d) {
            tooltip.style("visibility", "visible").text(Math.round((d.toElement.__data__[1] - d.toElement.__data__[0]) * 100) / 100).select("text").attr("font-size", "16px").attr("color", "white")
        }).on("mousemove", function (d) { tooltip.style("top", (event.pageY - 10) + "px").style("left", (event.pageX + 10) + "px"); }).on("mouseout", function (d) {
            tooltip.style("visibility", "hidden");
        });
    });
}

var plot4 = function (filePath) {
    // plot the map of Europe

    d3.csv(filePath).then(function (data) {
        d3.json("data/europe.geojson").then(function (geoData) {
            // console.log(geoData)

            const WIDTH = 1000;
            const HEIGHT = 700;
            const MARGIN = 100;

            var svg = d3.select("#q4_plot").append("svg").attr("width", WIDTH).attr("height", HEIGHT);

            var projection = d3.geoMercator().fitSize([WIDTH, HEIGHT], geoData);
            var path = d3.geoPath().projection(projection);
            var geoplot = svg.append("g").attr("x", MARGIN).selectAll("path").data(geoData.features).enter().append("path").attr("d", path).attr("fill", "lightgrey").attr("stroke", "black").attr("class", "country");
            // enlarge the outline of the countries
            geoplot.on("mouseover", d => {
                d3.select(d.toElement).transition().duration(100).attr("stroke-width", 2.5);
            });
            geoplot.on("mouseleave", d => {
                console.log('leave')
                d3.selectAll(".country").transition().duration(200).attr("stroke-width", 1);
            });

            // plot each airbnb listing on the map with longitude (lng) and latitude (lat)
            data = d3.map(data, function (d) {
                return { city: d.city, lat: parseFloat(d.lat), lng: parseFloat(d.lng), room_type: d.room_type };
            });
            console.log(data);

            // get the percentage of listings that are private rooms
            var privateRoom = d3.rollup(data, v => [d3.mean(v, d => d.room_type == "Private room" ? 1.0 : 0.0), v[0].lng, v[0].lat], d => d.city);
            privateRoom = d3.map(privateRoom, function (d) {
                return { city: d[0], percentage: d[1][0], lng: d[1][1], lat: d[1][2] };
            });
            // create a continuous color scale for the percentage of private rooms
            var colorScale = d3.scaleSequential(d3.interpolateBlues).domain([0, 1]);

            // plot the percentage of private rooms on the map and add names of the cities
            svg.selectAll("circle").data(privateRoom).enter().append("circle").attr("cx", d => projection([d.lng, d.lat])[0]).attr("cy", d => projection([d.lng, d.lat])[1]).attr("r", 7).attr("fill", d => colorScale(d.percentage)).attr("stroke", "black").attr("stroke-width", 0.5);
            svg.selectAll("text").data(privateRoom).enter().append("text").attr("x", d => projection([d.lng, d.lat])[0] + 10).attr("y", d => projection([d.lng, d.lat])[1] + 5).text(d => d.city[0].toUpperCase() + d.city.slice(1)).attr("font-size", "13px").style("fill", "black").style("font-weight", "bold");

            // legend
            var legend = svg.append("g").attr("transform", "translate(" + (WIDTH - MARGIN) + "," + (HEIGHT - MARGIN) + ")");
            var yScale = d3.scaleBand().domain([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]).range([-100, 100]);
            var yAxis = d3.axisRight(yScale).tickFormat(d3.format(".0%")).tickSize(0);
            legend.append("g").call(yAxis);
            legend.selectAll("rect").data([0, 0.1, 0.2, 0.3, 0.4, 0.5, 0.6, 0.7, 0.8, 0.9, 1.0]).enter().append("rect").attr("x", -20).attr("y", d => yScale(d)).attr("width", 20).attr("height", 20).attr("fill", d => colorScale(d)).attr("stroke", "black").attr("stroke-width", 0.5);

            // title
            svg.append("text").attr("x", MARGIN + 200).attr("y", MARGIN / 2).attr("text-anchor", "middle").attr("font-size", "24px").text("Percentage of Private Rooms in Each City").style("font-weight", "bold");
        });
    });

}

var plot5 = function (filePath) {
    d3.csv(filePath).then(function (data) {
        // create box plots for each city about the distance (dist)
        const WIDTH = 700;
        const HEIGHT = 900;
        const MARGIN = 120;

        // get all the cities
        const CITIES = [...new Set(data.map(d => d.city))];
        var colorScale = d3.scaleOrdinal(d3.schemeCategory10).domain(CITIES);
        var datasets = {};
        for (var i = 0; i < CITIES.length; i++) {
            datasets[CITIES[i]] = data.filter(d => d.city == CITIES[i]);
            // find the stats for each city
            datasets[CITIES[i] + "q1"] = d3.quantile(datasets[CITIES[i]], 0.25, d => parseFloat(d.metro_dist));
            datasets[CITIES[i] + "q3"] = d3.quantile(datasets[CITIES[i]], 0.75, d => parseFloat(d.metro_dist));
            datasets[CITIES[i] + "median"] = d3.median(datasets[CITIES[i]], d => parseFloat(d.metro_dist));
            var range = datasets[CITIES[i] + "q3"] - datasets[CITIES[i] + "q1"];
            datasets[CITIES[i] + "min"] = datasets[CITIES[i] + "q1"] - 1.5 * range < d3.min(datasets[CITIES[i]], d => parseFloat(d.metro_dist)) ? d3.min(datasets[CITIES[i]], d => parseFloat(d.metro_dist)) : datasets[CITIES[i] + "q1"] - 1.5 * range;
            datasets[CITIES[i] + "max"] = datasets[CITIES[i] + "q3"] + 1.5 * range > d3.max(datasets[CITIES[i]], d => parseFloat(d.metro_dist)) ? d3.max(datasets[CITIES[i]], d => parseFloat(d.metro_dist)) : datasets[CITIES[i] + "q3"] + 1.5 * range;

            datasets[CITIES[i] + "yScale"] = d3.scaleLinear().domain([0, datasets[CITIES[i] + "max"] * 1.05]).range([HEIGHT - MARGIN, MARGIN]);
        }

        // add options to the drop down menu
        d3.select("#q5_button").selectAll("option").data(CITIES).enter().append("option").attr("value", d => d).text(d => d[0].toUpperCase() + d.slice(1));

        // create the svg
        var svg = d3.select("#q5_plot").append("svg").attr("width", WIDTH).attr("height", HEIGHT);

        // create the box plots
        var yAxis = svg.append("g").attr("transform", "translate(" + MARGIN + ",0)");

        var verticalLine = svg.append("line");
        var box = svg.append("rect");
        var medianLine = svg.append("line");
        var minLine = svg.append("line");
        var maxLine = svg.append("line");

        // create the title
        var title = svg.append("text").attr("x", MARGIN + 200).attr("y", MARGIN / 2).attr("text-anchor", "middle").attr("font-size", "24px").text("Distance to the Nearest Subway Station").style("font-weight", "bold");

        var yAxisLabel = svg.append("text").attr("x", MARGIN / 2).attr("y", HEIGHT / 2).attr("text-anchor", "middle").attr("font-size", "18px").text("Distance (km)").attr("transform", "rotate(-90 " + MARGIN / 2 + "," + HEIGHT / 2 + ")");

        var update = function () {
            let city = d3.select("#q5_button").property("value");
            console.log(city);

            // update the y axis
            yAxis.transition().duration(1000).call(d3.axisLeft(datasets[city + "yScale"]));

            // update the box plot
            medianLine.transition().duration(1000).attr("x1", 2 * MARGIN).attr("y1", datasets[city + "yScale"](datasets[city + "median"])).attr("x2", WIDTH - MARGIN * 2).attr("y2", datasets[city + "yScale"](datasets[city + "median"])).attr("stroke", "black").attr("stroke-width", 2);
            box.transition().duration(1000).attr("x", 2 * MARGIN).attr("y", datasets[city + "yScale"](datasets[city + "q3"])).attr("width", WIDTH - 4 * MARGIN).attr("height", datasets[city + "yScale"](datasets[city + "q1"]) - datasets[city + "yScale"](datasets[city + "q3"])).attr("fill", colorScale(city)).attr("stroke", "black").attr("stroke-width", 2);

            // update the horizontal lines (min, max)
            minLine.transition().duration(1000).attr("x1", 2 * MARGIN).attr("y1", datasets[city + "yScale"](datasets[city + "min"])).attr("x2", WIDTH - MARGIN * 2).attr("y2", datasets[city + "yScale"](datasets[city + "min"])).attr("stroke", "black").attr("stroke-width", 2);
            maxLine.transition().duration(1000).attr("x1", 2 * MARGIN).attr("y1", datasets[city + "yScale"](datasets[city + "max"])).attr("x2", WIDTH - MARGIN * 2).attr("y2", datasets[city + "yScale"](datasets[city + "max"])).attr("stroke", "black").attr("stroke-width", 2);

            // update the vertical line
            verticalLine.transition().duration(1000).attr("x1", MARGIN * 3).attr("y1", datasets[city + "yScale"](datasets[city + "min"])).attr("x2", MARGIN * 3).attr("y2", datasets[city + "yScale"](datasets[city + "max"])).attr("stroke", "black").attr("stroke-width", 2);

            title.transition().duration(1000).text("Distance to the Nearest Subway Station (" + city[0].toUpperCase() + city.slice(1) + ")");
        }

        update();
        d3.select("#q5_button").on("change", update);
    });
}