var width = $('#content').parent().width(),
    height = 700,
    centered;

var svg, projection, path, g;
var school_scale, school_data;

var identifiers = {
  'no_neighborhood_data' : {
    'domain' : [],
    'range' : []
  },
  // 'poverty' : {
  //   'domain' : [.01, .17, .27, .38],
  //   'range' : ["#e5ffc7", "#d9fcb9", "#bbef8e", "#9ad363", "#6eb43f"]
  // },
  'no_hs_degree_25_plus' : {
    'domain' : [99, 270, 548, 898],
    'range' : ["#e5ffc7", "#d9fcb9", "#bbef8e", "#9ad363", "#6eb43f"]
  },
  'population_total' : {
    'domain' : [2566, 7928, 17362, 28207],
    'range' : ["#e5ffc7", "#d9fcb9", "#bbef8e", "#9ad363", "#6eb43f"]
  },
  'population_under_18' : {
    'domain' : [287, 1643, 2924, 4727],
    'range' : ["#e5ffc7", "#d9fcb9", "#bbef8e", "#9ad363", "#6eb43f"]
  },
  'population_under_18' : {
    'domain' : [287, 1643, 2924, 4727],
    'range' : ["#e5ffc7", "#d9fcb9", "#bbef8e", "#9ad363", "#6eb43f"]
  },
}

var all_data = {},
    choropleth_data;

$(document).ready(function() {
  init();
}); // end document ready function

function init(){
  drawChoropleth();
  drawSchools();

  // slide out menu
  $('.menu-toggle').on('click', function(){
    if ($(this).parent().hasClass('toggled')){
      $(this).parent().animate({ 'left' : 0 }, 350, function(){ $('#main-container').removeClass('toggled') });
    } else {
      $(this).parent().animate({ 'left' : $('#nav-panel').width() }, 350, function(){ $('#main-container').addClass('toggled') });
    }
  });

  // event listeners for changing d3
  // choropleth color change
  $('.neighborhood-menu > li').on('click', 'a', function(e){
    e.preventDefault();
    changeNeighborhoodData($(this).attr('id'));
    $(this).parent().addClass('selected').siblings().removeClass('selected');
  });
  // circle changes
  $('.school-menu > li').on('click', 'a', function(e){
    e.preventDefault();
    var value = $(this).attr('id') === 'no_school_data' ? 4 : $(this).attr('id');
    changeSchoolData(value);
    $(this).parent().addClass('selected').siblings().removeClass('selected');
  });
}

function drawChoropleth(){

  projection = d3.geo.mercator()
    .center([-77.01551, 38.90755]) // Dunbar High School
    .scale(150000)
    .translate([width/2, height/2]);

  path = d3.geo.path().projection(projection);

  svg = d3.select("#content")
    .append("svg:svg")
    .attr("width", width)
    .attr("height", height);

  svg.append("rect")
      .attr("class", "background")
      .attr("width", width)
      .attr("height", height)
      .on("click", clicked);

  g = svg.append("g");
  g.append("g").attr("id", "neighborhoods");
  g.append("g").attr("id", "schools");

  queue()
    // .defer(d3.json, "data/neighborhood_boundaries.json")
    // .defer(d3.csv, "data/neighborhoods.csv")
    .defer(d3.json, "data/neighborhoods44.json")
    .defer(d3.csv, "data/neighborhoods44.csv")
    .await(setUpChoropleth);

  function setUpChoropleth(error, dc, choropleth) {
    choropleth_data = choropleth;
    choropleth_data.forEach(function(d) {
      all_data[d.gis_id] = d;
      choropleth_data[d.gis_id] = +d.poverty;
    });

    g.select("#neighborhoods")
      .selectAll("path")
        .data(dc.features)
      .enter().append("path")
        .attr("d", path)
        .attr('class', 'nbhd')
        .on("click", clicked)
        .style("fill", "#AAA");

  } // setUpChoropleth function

}

function changeNeighborhoodData(new_data_column) {
  var choro_color = d3.scale.threshold()
    .domain(identifiers[new_data_column]['domain'])
    .range(identifiers[new_data_column]['range']);

  choropleth_data.forEach(function(d) {
    choropleth_data[d.gis_id] = +d[new_data_column];
  });
  g.select("#neighborhoods").selectAll("path")
    .transition().duration(600)
    .style("fill", function(d) {
      return choro_color(all_data[d.properties.gis_id][new_data_column]);
    });
}  

function drawSchools(){
  var packer = sm.packer();

  d3.csv('data/schools.csv', function(data){
    school_data = data;
    school_scale = d3.scale.sqrt().range([1,10]);
    g.select("#schools").selectAll("circle")
      .data(data).enter().append("circle")
        .attr('class', 'school')
        .attr("r", 4)
        .attr("transform", function(d) {
          return "translate(" + 
            projection([d.long, d.lat]) +
            ")";})
        .on("click", displaySchoolData)
        .append("title").text(function(d){return d.name;});
    packMetros();
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
}

function changeSchoolData(new_data_column) {
  if (typeof new_data_column === 'string'){
    matchScaleToData(school_scale, function(d){return +d[new_data_column];})
  }
  g.select("#schools").selectAll("circle")
    .transition().duration(600)
    .attr("r", function(d) {
      return typeof new_data_column !== 'string' ? 4 : school_scale(d[new_data_column]);
    });
}

function matchScaleToData(scale, fieldFunction) {
  var minimum = d3.min(school_data, fieldFunction),
      maximum = d3.max(school_data, fieldFunction);
  scale.domain([minimum, maximum]);
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