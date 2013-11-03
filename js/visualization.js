$(document).ready(function() {

var width = 600,
    height = 600,
    centered;
	
var poverty_threshold = d3.scale.threshold()
    .domain([.01, .17, .27, .38])
    .range(["#e5ffc7", "#d9fcb9", "#bbef8e", "#9ad363", "#6eb43f"]);

var diploma_threshold = d3.scale.threshold()
    .domain([.06, .14, .19, .23])
    .range(["#000", "#333", "#666", "#999", "#AAA"]);

var packer = sm.packer();

projection = d3.geo.mercator()
  .center([-77.01551, 38.90755]) // Dunbar High School
  .scale(150000)
  .translate([width/2, height/2]);

var path = d3.geo.path().projection(projection)

svg = d3.select("#content")
  .append("svg:svg")
  .attr("width", width)
  .attr("height", height)

svg.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)
    .on("click", clicked);

var g = svg.append("g");
g.append("g").attr("id", "neighborhoods");
g.append("g").attr("id", "schools");

queue()
    .defer(d3.json, "data/neighborhood_boundaries.json")
    .defer(d3.csv, "data/neighborhoods.csv")
    .await(ready);

function ready(error, dc, choropleth) {
	var all_data = {};

  choropleth.forEach(function(d) {
	  all_data[d.gis_id] = d;
	  choropleth[d.gis_id] = +d.poverty;
  });

  g.select("#neighborhoods")
    .selectAll("path")
      .data(dc.features)
    .enter().append("path")
      .attr("d", path)
      .on("click", clicked)
      .style("fill", function(d) { return poverty_threshold(choropleth[d.properties.gis_id]); });
  d3.select("#diploma").on("click", function() {changeNeighborhoodData("diploma")});
  d3.select("#poverty").on("click", function() {changeNeighborhoodData("poverty")});
  function noNeighborhoodData() {
    g.select("#neighborhoods").selectAll("path")
      .transition().duration(600)
      .style("fill", "#333");
  }
  function changeNeighborhoodData(new_data_column) {
	choropleth.forEach(function(d) {
		choropleth[d.gis_id] = +d[new_data_column];
	});
	g.select("#neighborhoods").selectAll("path")
      .transition().duration(600)
      .style("fill", function(d) { return diploma_threshold(all_data[d.properties.gis_id][new_data_column])})
  }
}

d3.csv('data/schools.csv', function(data){
  var scale = d3.scale.sqrt().range([1,10]);
  g.select("#schools").selectAll("circle")
    .data(data).enter().append("circle")
      .attr("r", 4)
      .attr("fill-opacity", 0.7)
      .attr("fill", "#000099")
      .attr("transform", function(d) {
        return "translate(" + 
          projection([d.long, d.lat]) +
          ")";})
      .on("click", displaySchoolData)
      .append("title").text(function(d){return d.name;});
	packMetros();
  d3.select("#school_enrollment").on("click", function() {changeSchoolData("enrollment")});
  d3.select("#school_allocation").on("click", function() {changeSchoolData("alloc")});
  d3.select("#school_location").on("click", noSchoolData);
  function noSchoolData() {
    g.select("#schools").selectAll("circle")
      .transition().duration(600)
      .attr("r", 4)
  }
  function changeSchoolData(new_data_column) {
    matchScaleToData(scale, function(d){return +d[new_data_column];})
    g.select("#schools").selectAll("circle")
      .transition().duration(600)
      .attr("r", function(d) {return scale(d[new_data_column])})
  }
  function matchScaleToData(scale, fieldFunction) {
    var minimum = d3.min(data, fieldFunction),
        maximum = d3.max(data, fieldFunction);
    scale.domain([minimum, maximum]);
  }
  function displaySchoolData(school) {
    $("#details").prepend("<div class='well well-sm'><h3>"+school.name+"</h3><h4>enrollment: " +
                              school.enrollment + "</h4><h4>allocation: " +
                              school.alloc + "</h4></div>");
  }
});

function packMetros() {
	var elements = d3.selectAll('#content circle')[0];
	packer.elements(elements).start();
}

function clicked(d) {
  var x, y, k;

  if (d && centered !== d) {
    var centroid = path.centroid(d);
    x = centroid[0];
    y = centroid[1];
    k = 4;
    centered = d;
  } else {
    x = width / 2;
    y = height / 2;
    k = 1;
    centered = null;
  }

  g.selectAll("path")
      .classed("active", centered && function(d) { return d === centered; });

  g.transition()
      .duration(750)
      .attr("transform", "translate(" + width / 2 + "," + height / 2 + ")scale(" + k + ")translate(" + -x + "," + -y + ")")
      .style("stroke-width", 1.5 / k + "px");
}

}); // end document ready function
