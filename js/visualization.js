var width = $('#content').parent().width(),
    height = 700,
    centered;

var svg, projection, path, g;
var school_scale, school_data;

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
  g.append("g").attr("id", "legend");

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
      choropleth_data[d.gis_id] = +d.population_total;
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
  var data_values = _.compact(_.map(choropleth_data, function(d){ return parseFloat(d[new_data_column]); }));
  var jenks = _.unique(ss.jenks(data_values, 3));
  var color_palette = ["#e5ffc7", "#d9fcb9", "#bbef8e", "#9ad363", "#6eb43f"];
  var choro_color = d3.scale.threshold()
    .domain(jenks)
    .range(color_palette);

  choropleth_data.forEach(function(d) {
    choropleth_data[d.gis_id] = +d[new_data_column];
  });

  g.select("#neighborhoods").selectAll("path")
    .transition().duration(600)
    .style("fill", function(d) {
      return choro_color(all_data[d.properties.gis_id][new_data_column]);
    });

  var legendText = function(d, jenks){
    if(_.max(jenks) < 1){
      return parseInt(d * 100, 10) + "%";
    } else {
      return parseInt(d, 10);
    }
  };

  var updatedLegend = g.select("#legend").selectAll(".legend")
      .data(jenks);

  updatedLegend.select("text")
    .text(function(d){ return legendText(d, jenks);});

  enterLegend = updatedLegend.enter().append("g")
    .attr("transform", function(d, i){ return "translate(0," + (350 + i * 35) + ")"; })
    .attr("class", "legend");

  enterLegend.append("rect")
    .attr("width", 100)
    .attr("height", 30)
    .style("fill", function(d){ return choro_color(d);});

  enterLegend.append("text")
    .style("fill", "black")
    .attr("dy",20)
    .attr("dx", 5)
    .text(function(d){ return legendText(d, jenks); });

  updatedLegend.exit().remove();

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

  // if d is a neighborhood boundary and clicked
  if (d && all_data[d.properties.gis_id]){
    var $popbox = $('#pop-info'),
        highlighted = all_data[d.properties.gis_id];

    $popbox.siblings('.panel-heading').find('.panel-title').html(highlighted.NBH_NAMES);

    $.each($popbox.find('tr'), function(k, row){
      $(row).find('.count').html(highlighted[$(row).attr('data-type')]);
    });
  }
}
