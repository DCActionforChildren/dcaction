var COUNT_SCHOOL_DISPLAY = 3;

var width = $('#content').parent().width(),
    height = 800,
    centered;

var svg, projection, path, g;
var school_scale, school_data, activeId, choropleth_data;
var all_data = {}, activeData = 'population_total';
var min_population = 100;
var defaultColor = "#aaa",
    fiveColors = ["#e5ffc7", "#d9fcb9", "#bbef8e", "#9ad363", "#6eb43f"],
    fourColors = ["#e5ffc7", "#d9fcb9", "#bbef8e", "#6eb43f"],
    threeColors = ["#e5ffc7", "#bbef8e", "#6eb43f"];

$(document).ready(function() {
  init();
}); // end document ready function

function init(){
  drawChoropleth();
  drawSchools();

  // slide out menu
  $('.menu-toggle').on('click', toggleMenu);

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
    .center([-77.01551, 38.89555]) // Dunbar High School
    .scale(160000)
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
    //clean choropleth data for display.
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
        .on("mouseover", hoverNeighborhood)
        .style("fill", defaultColor);

  } // setUpChoropleth function

}

function changeNeighborhoodData(new_data_column) {
  var data_values = _.compact(_.map(choropleth_data, function(d){ return parseFloat(d[new_data_column]); }));
  var jenks = _.unique(_.compact(ss.jenks(data_values, 4)));
  var color_palette = [ "#e5ffc7", "#d9fcb9", "#bbef8e", "#9ad363", "#6eb43f", "#6eb43f"];
  activeData = new_data_column;

  var choro_color = d3.scale.threshold()
    .domain(jenks)
    .range(color_palette);

  choropleth_data.forEach(function(d) {
    choropleth_data[d.gis_id] = +d[new_data_column];
  });

  g.select("#neighborhoods").selectAll("path")
    .transition().duration(600)
    .style("fill", function(d) {
      var totalPop = all_data[d.properties.gis_id].population_total;
      return totalPop > min_population ? choro_color(all_data[d.properties.gis_id][new_data_column]) : defaultColor;
    });

  if(activeId && new_data_column !== 'no_neighborhood_data') {
    setVisMetric(new_data_column, all_data[activeId][new_data_column]);
  } else {
    setVisMetric(null, null, true);
  }

  var legendText = function(d, jenks){
    if(_.max(jenks) < 1){
      return parseInt(d * 100, 10) + "%";
    } else {
      var number_formatter = d3.format(",");
      return number_formatter(parseInt(d, 10));
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
    .attr("width", 70)
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
      var $schools = $('#schools_panel');
      var $panelBody = $schools.find('.panel-body');
      var $schoolData = $panelBody.children('.school-data');

      //Don't add the school twice.
      for (var i = 0, len = $schoolData.length; i < len; i++) {
          if(school.name === $($schoolData[i]).find('.school-name').text()) { return; }
      }

      //Show panel on first school click.
      if ($schools.hasClass('hide')) {
        $schools.toggleClass('hide');
      }

      //Limit number of displayed schools.
      if ($schoolData.length === COUNT_SCHOOL_DISPLAY) {
        $panelBody.children(':nth-child(' + COUNT_SCHOOL_DISPLAY + ')').remove();
      }

      //Add a new school to the display.
      var $schoolDisplay = $panelBody.find('#school_data').clone();
      $panelBody.prepend(buildNewSchool($schoolDisplay, school));
    }

    function buildNewSchool($schoolDisplay, school) {
      $schoolDisplay.removeAttr('id').removeAttr('class').addClass('school-data');

      var $schoolName = $schoolDisplay.find('.school-name');
      $schoolName.html(school.name);
      $schoolName.on('click', function() {
        $schoolDisplay.remove();
        setPanel();
      });
      $schoolDisplay.find('.school-enrollment').html(getDisplayValue(school.enrollment, 'enrollment'));
      $schoolDisplay.find('.school-allocation').html(getDisplayValue(school.alloc, 'alloc'));
      return $schoolDisplay;
    }

    function setPanel() {
      var $schools = $('#schools_panel');
      var $panelBody = $schools.find('.panel-body');

      if ($panelBody.children().length === 1) {
        $schools.toggleClass('hide');
      }
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

function toggleMenu() {
  var $this = $('.menu-toggle');
  if ($this.parent().hasClass('toggled')){
    $this.parent().animate({ 'left' : 0 }, 350, function(){ $('#main-container').removeClass('toggled') });
  } else {
    $this.parent().animate({ 'left' : $('#nav-panel').width() }, 350, function(){ $('#main-container').addClass('toggled') });
  }
}

function displayPopBox(d) {
  //clear the menu if it's exposed.
  if($('#main-container')[0].classList.contains('toggled')) {
    toggleMenu();
  }

  var $popbox = $('#pop-info'),
      highlighted = all_data[d.properties.gis_id];

  d3.select('.neighborhood').html(highlighted.NBH_NAMES);

  var val, key;
  $.each($popbox.find('tr'), function(k, row){
    key = $(row).attr('data-type');
    val = highlighted[key];
    $(row).find('.count').html(getDisplayValue(val, key));
  });
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
    displayPopBox(d);
    //last neighborhood to display in popBox.
    activeId = d.properties.gis_id;
    setVisMetric(activeData, all_data[activeId][activeData]);
  }
}

function hoverNeighborhood(d) {

  //bring hovered neighborhood path to front.
  var neighborhood = d3.select(d3.event.target);
  neighborhood.each(function () {
    this.parentNode.appendChild(this);
  });

  //but also keep centered neighborhood path up front
  if (centered) { 
    var activeNeighborhood = d3.select(".active");
    activeNeighborhood.each(function () {
      this.parentNode.appendChild(this);
    });  
    return; 
  }


  if (d && all_data[d.properties.gis_id]){
    displayPopBox(d);
    //last neighborhood to display in popBox.
    activeId = d.properties.gis_id;
    setVisMetric(activeData, all_data[activeId][activeData]);
  }
}

function getDisplayValue(strNum, name) {
  var num = parseFloat(strNum);
  var number_formatter = d3.format(",");

  if (isNaN(num)) { return strNum; }

  name = name.toLowerCase();

  if (name.indexOf('perc') !== -1) { //percentage
    return parseInt(num * 100, 10) + "%";
  } else if ((name.indexOf('alloc') !== -1) || (name.indexOf('amount') !== -1)) {  //some kind of allocation or amount

    return '$' + number_formatter(parseInt(num, 10));
  } else if (name.indexOf('ratio') !== -1) { //a ratio
    return num.toPrecision(2);
  }

  num = Math.round(num);
  return number_formatter(parseInt(num, 10));
}

function setVisMetric(metric, val, clear) {
  var $metric = $('#visualized-metric');
  var $metricDesc = $('#visualized-measure');

  if (clear) {
    $metric.text('');
    $metricDesc.text('');
    return;
  }

  var metricText = $('a#' + metric).text();
  $metric.text(metricText);
  $metricDesc.text(getDisplayValue(val, metricText));
};


