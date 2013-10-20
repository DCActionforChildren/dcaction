$(document).ready(function() {

var packer = sm.packer();


projection = d3.geo.albersUsa()
.scale(160000)
.translate([-41500, 5000]);
path = d3.geo.path().projection(projection)

svg = d3.select("#content")
  .append("svg:svg")
  .attr("width", 750)
  .attr("height", 600)

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

$.get('data/schools.json', function(point){
	var scale = d3.scale.linear().domain([0,200]).range([1,5])
	point.schools.forEach(function(point){
	  svg.append("circle").attr("r",scale(point.enrollment)).attr("fill-opacity", 0.5).attr("fill", "#FF0000").attr("transform", function() {return "translate(" + projection([point.long, point.lat]) + ")";});
	  packMetros();
	})
})

			function packMetros() {
			
				var elements = d3.selectAll('#content circle')[0];
				
				packer.elements(elements).start();
			
			}

	  svg.append("circle").attr("r",5).attr("transform", function() {return "translate(" + projection([-77.01, 38.91]) + ")";});

});		
