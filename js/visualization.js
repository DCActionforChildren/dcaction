$(document).ready(function() {

var packer = sm.packer();

projection = d3.geo.albersUsa()
  .scale(160000)
  .translate([-41630, 4900]);
path = d3.geo.path().projection(projection)

svg = d3.select("#content")
  .append("svg:svg")
  .attr("width", 500)
  .attr("height", 500)

d3.json("data/neighborhood_boundaries.json", function(json) {
  svg.append("svg:g")
  .selectAll("path")
    .data(json.features)
  .enter().append("svg:path")
    .attr("d", path)
    .attr("fill-opacity", 0.5)
	.attr("fill", "#000")
    .attr("stroke", "#000")
});

d3.csv('data/schools.csv', function(data){
	var scale = d3.scale.linear().domain([0,200]).range([1,5])
  svg.selectAll("circle")
    .data(data).enter().append("circle")
      .attr("r", function(d) {return scale(d.enrollment)})
      .attr("fill-opacity", 0.5)
      .attr("fill", "#FF0000")
      .attr("transform", function(d) {
        return "translate(" + 
          projection([d.long, d.lat]) +
          ")";});
	packMetros();
});

function packMetros() {
	var elements = d3.selectAll('#content circle')[0];
	packer.elements(elements).start();
}

}); // end document ready function

function changeSchoolData(new_data) {
  var scale = d3.scale.linear().domain([0,1000000]).range([1,5])
  svg.selectAll("circle")
    .transition().duration(600)
    .attr("r", function(d) {return scale(d[new_data])})
}
