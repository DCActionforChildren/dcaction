$(document).ready(function() {

var data;

//var popChoro = d3.map();
//
//var quantize = d3.scale.quantize()
//    .domain([0, 47378])
//    .range(d3.range(5).map(function(i) { return "q" + i + "-9"; }));

var width = 750,
    height = 600,
    centered;

var projection = d3.geo.albersUsa()
.scale(160000)
.translate([-41500, 5000]);

var path = d3.geo.path()
    .projection(projection);

var svg = d3.select("#content").append("svg")
    .attr("width", width)
    .attr("height", height);
	
//queue()
//    .defer(d3.json, "data/neighborhood_boundaries.json")
//    .defer(d3.csv, "data/neighborhoods.csv", function(d) { popChoro.set(d.gis_id, +d.population_total); })
//    .await(ready);
	
svg.append("rect")
    .attr("class", "background")
    .attr("width", width)
    .attr("height", height)
    .on("click", clicked);

var g = svg.append("g");

d3.json("data/neighborhood_boundaries.json", function(error, dc) {
  g.append("g")
      .attr("id", "neighborhoods")
    .selectAll("path")
      .data(dc.features)
    .enter().append("path")
      .attr("d", path)
//	.attr('fill', function(d){
//	 
//		$.each(state_data, function(key, data){
//			if(dc. == abbr){
//				state_president = data.president;
//			}
//		})
//	 
//		// Return colors
//		// based on data					
//		if(state_president == "Obama"){
//			return "blue"
//		}
//		else if(state_president == "McCain"){
//			return "red"
//		}
//		else {
//			return "#CCC"
//		}
//	})
	.on("click", clicked);

  g.append("path")
      .datum(topojson.mesh(dc, dc.features, function(a, b) { return a !== b; }))
      .attr("id", "state-borders")
      .attr("d", path);
});

//function ready(error, dc) {
//  svg.append("g")
////      .attr("class", "q0-9")
//    .selectAll("path")
//      .data(dc.features)
//    .enter().append("path")
////      .attr("class", function(d) { return quantize(popChoro.get(d.gis_id)); })
//      .attr("d", path);
//	  console.log(quantize(popChoro))
//}

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

//d3.csv("data/neighborhoods.csv", function(csv) {
//  data = csv;
//  g.selectAll("path")
//      .attr("class", quantize);
//});
// 
//function quantize(d) {
//  return "q" + Math.min(8, ~~(data[d.population_total] * 9 / 12)) + "-9";
//}

//var packer = sm.packer();
//
//
//projection = d3.geo.albersUsa()
//.scale(160000)
//.translate([-41500, 5000]);
//path = d3.geo.path().projection(projection)
//
//svg = d3.select("#content")
//  .append("svg:svg")
//  .attr("width", 750)
//  .attr("height", 600)
//
//d3.json("data/neighborhood_boundaries.json", function(json) {
//  svg.append("svg:g")
//  .selectAll("path")
//    .data(json.features)
//  .enter().append("svg:path")
//    .attr("d", path)
//    .attr("fill-opacity", 0.5)
//	.attr("fill", "#000")
//    .attr("stroke", "#000")
//});	
//
//$.get('data/schools.json', function(point){
//	var scale = d3.scale.linear().domain([0,200]).range([1,5])
//	point.schools.forEach(function(point){
//	  svg.append("circle").attr("r",scale(point.enrollment)).attr("fill-opacity", 0.5).attr("fill", "#FF0000").attr("transform", function() {return "translate(" + projection([point.long, point.lat]) + ")";});
//	  packMetros();
//	})
//})
//
//			function packMetros() {
//			
//				var elements = d3.selectAll('#content circle')[0];
//				
//				packer.elements(elements).start();
//			
//			}

//	  svg.append("circle").attr("r",5).attr("transform", function() {return "translate(" + projection([-77.01, 38.91]) + ")";});

});		
