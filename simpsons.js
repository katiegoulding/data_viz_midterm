(function() {

  let data = ""; // keep data in global scope
  let svgContainer = ""; // keep SVG reference in global scope

  // load data and make bar chart after window loads
  window.onload = function() {
    svgContainer = d3.select('body').append('svg')
      .attr('width', 1000)
      .attr('height', 505)
      .style("background", "#FFFF99")

    // create title bar
    svgContainer.append('rect')
      .attr('height', 20)
      .attr('width', 900)
      .attr('x', 20)
      .attr('y', 20)
      .attr('stroke', "#57A0D3")
      .style('fill', "#57A0D3")

    svgContainer.append('text')
      .attr('x', 30)
      .attr('y', 35)
      .attr("font-size", 16)
      .attr("font-weight", "bold")
      .attr("font-style", "italic")
      .text('Average Viewership By Season')
      .style("fill", "white");

    // add white background to chart
    svgContainer.append('rect')
      .attr('height', 430)
      .attr('width', 900)
      .attr('x', 20)
      .attr('y', 44)
      .attr('stroke', "white")
      .style('fill', "white")

    // load in simpsons season data and pass to makeBarChart
    d3.csv('simpsonsSeasonData.csv')
      .then((data) => makeBarChart(data));
  }

  // make bar chart with "average" line in chart
  function makeBarChart(csvData) {

    data = csvData;
    
    // get an array of avg viewers and an array of season years
    let avgViewers = data.map((row) => parseInt(row["Avg. Viewers (mil)"]));
    let season = data.map((row) => parseFloat(row["Year"]));

    let axesLimits = findMinMax(avgViewers, season);
    
    // draw axes with ticks and return mapping and scaling functions
    let mapFunctions = drawTicks(axesLimits);

    // plot the data using the mapping and scaling functions
    plotData(mapFunctions);

    // plot the average viewers line 
    plotLine(mapFunctions);

    // create legend of viewership data
    makeLegend();
  }

  // plot all the data points on the SVG
  function plotData(map) {
    let xMap = map.x;
    let yMap = map.y;

    var div = d3.select("body").append("div")	
      .attr("class", "tooltip")				
      .style("opacity", 0);

    var tooltip = d3.select("body")
      .append("div")
      .attr("class", "tooltip")
      .style("background", "white");
          
    svgContainer.selectAll('.dot')
      .data(data)
      .enter()
      .append('rect')
        .attr('x', (d) => xMap(d) - 10)
        .attr('y', yMap)
        .attr('width', 25)
        .attr('height', (d) => 450 - yMap(d))
        .attr("fill", function(d) {
          if (d["Data"] == 'Estimated') {
            return "#8F8782";
          } else {
            return "#57A0D3";
          }
        })
        .attr("stroke", "grey")
        .on("mousemove", function(d){
          tooltip
            .html(
            "<div id=\"tooltip_head\">Season #" + d["Year"] + "<br>" +
            "<div id=\"left_info\">Year: " + "<div id=\"right_info\">" + d["Year"] + "<br>" + 
            "<div id=\"left_info\">Episodes: " + "<div id=\"right_info\">" + d["Episodes"] + "<br>" +             
            "<div id=\"left_info\">Avg Viewers (mil): " + "<div id=\"right_info\">"+ d["Avg. Viewers (mil)"] + "<br>" +             
            "<div id=\"left_info\">Most Watched Episode: " + "<div id=\"right_info\">" + d["Most watched episode"] + "<br>" +             
            "<div id=\"left_info\">Viewers (mil): " + "<div id=\"right_info\">" + d["Viewers (mil)"]
            )
            .style("top", d3.event.pageY + "px")
            .style("left", d3.event.pageX + "px")
            .style("display", "block")
            .style("border", "solid black 1px");
      })
      
      .on("mouseout", function(){ 
        tooltip.style("display", "none");
      });
      
      svgContainer.selectAll(".text")        
      .data(data)
      .enter()
      .append("text")
        .attr("class","label")
        .attr("x", (function(d) { return xMap(d); }  ))
        .attr("y", function(d) { return yMap(d) - 3; })
        .style('text-anchor', "middle")
        .attr("font-weight", "bold")
        .style("fill", "#808080")
        .text(function(d) { return d["Avg. Viewers (mil)"]; }); 
      }

    // plot average line
    function plotLine(map) {
      let xMap = map.x;
  
      var line = d3.line()
        .x(function(d) { return xMap(d); })
        .y(function() { return 291; }); 
  
      svgContainer.append("path")
        .datum(data)
        .attr("d", line)
        .style("stroke-dasharray", ("5, 5"))
        .attr("stroke-width", 3)
        .attr("stroke", "#D3D3D3");

      svgContainer.append("rect")   
        .attr("x", 57)
        .attr("y", 272)
        .attr("width", 24)
        .attr("height", 18)
        .style("fill", "white")
        .attr("opacity","0.7");

      svgContainer.append("text")
        .attr("x", 56)
        .attr("y", 282)
        .text("13.5")
        .style("font-size", 11)
        .attr("alignment-baseline","middle");    
    }

  // draw the axes and ticks
  function drawTicks(limits) {

    // return season year from a row of data
    let xValue = function(d) { return + d["Year"]; }

    // function to scale season score
    let xScale = d3.scaleLinear()
      .domain([limits.seasonMin - .5, limits.seasonMax + .5])
      .range([50, 900]);

    // xMap returns a scaled x value from a row of data
    let xMap = function(d) { return xScale(xValue(d)); };
    
    // plot x-axis at bottom of SVG
    let xAxis = d3.axisBottom().ticks(20).tickFormat(d3.format("d")).scale(xScale);

    svgContainer.append('g')
      .attr('transform', 'translate(0, 450)')
      .call(xAxis);

    svgContainer.append('text')
      .attr('x', 450)
      .attr('y', 490)
      .style("font-weight", "bold")
      .text('Season');

    // return avg viewers from a row of data
    let yValue = function(d) { return + d["Avg. Viewers (mil)"]}

    let yScale = d3.scaleLinear()
      .domain([limits.avgMax + 3, limits.avgMin - 3])
      .range([50, 450]);

    // yMap returns a scaled y value from a row of data
    let yMap = function (d) { return yScale(yValue(d)); };

    // plot y-axis at the left of SVG
    let yAxis = d3.axisLeft().scale(yScale);
    svgContainer.append('g')
      .attr('transform', 'translate(50, 0)')
      .call(yAxis);

    svgContainer.append('text')
      .attr('transform', 'translate(15, 300)rotate(-90)')
      .style("font-weight", "bold")
      .text('Avg. Viewers (in millions)');
    
    // return mapping and scaling functions
    return {
      x: xMap,
      y: yMap,
      xScale: xScale,
      yScale: yScale
    };

  }

  // make legend
  function makeLegend() {
    svgContainer.append("rect")   
      .attr("x", 740)
      .attr("y", 88)
      .attr("width", 18)
      .attr("height", 18)
      .style("fill", "#57A0D3")
      .attr("stroke", "#8F8782");
    
    svgContainer.append("text")
      .attr("x", 765)
      .attr("y", 102)
      .text("Actual")
      .style("font-size", "13px")
      .attr("alignment-baseline","middle");

    svgContainer.append("rect")
      .attr("x", 740)
      .attr("y", 118)
      .attr("width", 18)
      .attr("height", 18) 
      .style("fill", "#8F8782")
      .attr("stroke", "#8F8782");

    svgContainer.append("text")
      .attr("x", 765)
      .attr("y", 132)
      .text("Estimated")
      .style("font-size", "13px")
      .attr("alignment-baseline","middle");

    svgContainer.append("text")
      .attr("x", 740)
      .attr("y", 75)
      .text("Viewership Data")
      .style("font-size", "15px")
      .style("font-weight", "bold")
      .attr("alignment-baseline","middle");
}

  // find min and max for avg. viewers and season year
  function findMinMax(avgViewers, season) {

    let avgMin = d3.min(avgViewers);
    let avgMax = d3.max(avgViewers);

    // round x-axis limits
    avgMax = Math.round(avgMax*10)/10;
    avgMin = Math.round(avgMin*10)/10;

    let seasonMin = d3.min(season);
    let seasonMax = d3.max(season);

    // round y-axis limits to nearest 0.05
    seasonMax = Number((Math.ceil(seasonMax*20)/20).toFixed(2));
    seasonMin = Number((Math.ceil(seasonMin*20)/20).toFixed(2));

    // return formatted min/max data as an object
    return {
      avgMin : avgMin,
      avgMax : avgMax,
      seasonMin : seasonMin,
      seasonMax : seasonMax
    }
  }
})();
