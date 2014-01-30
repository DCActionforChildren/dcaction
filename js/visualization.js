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
  'population_total' : {
    'domain' : [2566, 7928, 17362, 28207],
    'range' : ["#e5ffc7", "#d9fcb9", "#bbef8e", "#9ad363", "#6eb43f"]
  },
  'population_under_18' : {
    'domain' : [287, 1643, 2924, 4727],
    'range' : ["#e5ffc7", "#d9fcb9", "#bbef8e", "#9ad363", "#6eb43f"]
  },
  'population_under_5' : {
    'domain' : [205, 559, 1156, 1892],
    'range' : ["#e5ffc7", "#d9fcb9", "#bbef8e", "#9ad363", "#6eb43f"]
  },
  'children_poverty' : {
    'domain' : [0.367, 0.1332, 0.2236, 0.3662],
    'range' : ["#e5ffc7", "#d9fcb9", "#bbef8e", "#9ad363", "#6eb43f"]
  },
  'vacants' : {
    'domain' : [6, 21, 31, 46],
    'range' : ["#e5ffc7", "#d9fcb9", "#bbef8e", "#9ad363", "#6eb43f"]
  },
  'math' : {
    'domain' : [0.14, 0.355, 0.54, 0.75],
    'range' : ["#e5ffc7", "#d9fcb9", "#bbef8e", "#9ad363", "#6eb43f"]
  },
  'reading' : {
    'domain' : [0.22, 0.438, 0.6025, 0.7350],
    'range' : ["#e5ffc7", "#d9fcb9", "#bbef8e", "#9ad363", "#6eb43f"]
  },
  'grad' : {
    'domain' : [0.32, 0.40, 0.57, 0.80],
    'range' : ["#e5ffc7", "#d9fcb9", "#bbef8e", "#9ad363", "#6eb43f"]
  },
  'libraries' : {
    'domain' : [0, 1],
    'range' : ["#e5ffc7", "#bbef8e", "#6eb43f"]
  },
  'medicaid_enroll' : {
    'domain' : [872, 2392, 3468, 5725],
    'range' : ["#e5ffc7", "#d9fcb9", "#bbef8e", "#9ad363", "#6eb43f"]
  },
  'grocery' : {
    'domain' : [0, 1, 2],
    'range' : ["#e5ffc7", "#d9fcb9", "#bbef8e", "#6eb43f"]
  },
  'rec' : {
    'domain' : [0, 1, 2, 3],
    'range' : ["#e5ffc7", "#d9fcb9", "#bbef8e", "#9ad363", "#6eb43f"]
  },
  'metro' : {
    'domain' : [0, 1, 2, 3],
    'range' : ["#e5ffc7", "#d9fcb9", "#bbef8e", "#9ad363", "#6eb43f"]
  },
  'bus_stops' : {
    'domain' : [7, 58, 101, 138],
    'range' : ["#e5ffc7", "#d9fcb9", "#bbef8e", "#9ad363", "#6eb43f"]
  },
  'er_ast_10' : {
    'domain' : [44, 112, 181, 303],
    'range' : ["#e5ffc7", "#d9fcb9", "#bbef8e", "#9ad363", "#6eb43f"]
  },
  'prev_med_visit' : {
    'domain' : [307, 1132, 1774, 3766],
    'range' : ["#e5ffc7", "#d9fcb9", "#bbef8e", "#9ad363", "#6eb43f"]
  },
  'fs_client_2012' : {
    'domain' : [826, 2962, 6010, 9923],
    'range' : ["#e5ffc7", "#d9fcb9", "#bbef8e", "#9ad363", "#6eb43f"]
  },
  'dental_visit' : {
    'domain' : [460, 1257, 1981, 3109],
    'range' : ["#e5ffc7", "#d9fcb9", "#bbef8e", "#9ad363", "#6eb43f"]
  },
  'violent_crimes' : {
    'domain' : [0, 1, 3, 6],
    'range' : ["#e5ffc7", "#d9fcb9", "#bbef8e", "#9ad363", "#6eb43f"]
  },
  'cc_cap' : {
    'domain' : [56, 143, 251, 385],
    'range' : ["#e5ffc7", "#d9fcb9", "#bbef8e", "#9ad363", "#6eb43f"]
  },
  'cc_ratio' : {
    'domain' : [0.1467, 0.3546, 0.628, 1.4531],
    'range' : ["#e5ffc7", "#d9fcb9", "#bbef8e", "#9ad363", "#6eb43f"]
  },
  'cc_ratio_demand' : {
    'domain' : [0.0345, 0.0962, 0.2035, 0.4742],
    'range' : ["#e5ffc7", "#d9fcb9", "#bbef8e", "#9ad363", "#6eb43f"]
  },
  'cc_sub_13' : {
    'domain' : [33725, 420333, 818781, 2480378],
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
    //clean choropleth data for display.
    choropleth_data = cleanData(choropleth);
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

    //clean school data for display.
    school_data = cleanData(school_data);

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

  $popbox.siblings('.panel-heading').find('.panel-title').html(highlighted.NBH_NAMES);

  $.each($popbox.find('tr'), function(k, row){
    $(row).find('.count').html(highlighted[$(row).attr('data-type')]);
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
  }
}

function hoverNeighborhood(d) {
 if (centered) { return; }

  if (d && all_data[d.properties.gis_id]){
    displayPopBox(d);
  }
}

function cleanData(rawData) {
  var d, cleanedData = [];

  for (var i = 0, len = rawData.length; i < len; i++) {
    d = rawData[i];

    for(var key in d){
      if(d.hasOwnProperty(key) && !isNaN(parseInt(d[key], 10))) {
        d[key] = cleanNumber(d[key], key);
      }
    }

    cleanedData.push(d);
  }

  return cleanedData;

  function cleanNumber(strNum, name) {
    var num = parseFloat(strNum);

    if (name.indexOf('_perc') !== -1) { //percentage
      num = num * 100;
      num = Math.round(num);
      return num + '%';
    } else if (name.indexOf('alloc') !== -1) {  //some kind of allocation amount
      return '$' + num.addCommas();
    }

    num = Math.round(num)
    return num.addCommas(0);
  }
}

Number.prototype.addCommas = function(decimalPlaces) {
  var n = this,
      c = isNaN(decimalPlaces) ? 2 : Math.abs(decimalPlaces),
      d = '.',
      t = ',',
      sign = (n < 0) ? '-' : '',
      i = parseInt(n = Math.abs(n).toFixed(c), 10) + '',
      initialDigits = ((initialDigits = i.length) > 3) ? initialDigits % 3 : 0;

  return sign + (initialDigits? i.substr(0, initialDigits) + t : '')
      + i.substr(initialDigits).replace(/(\d{3})(?=\d)/g, '$1' + t)
      + (c ? d + Math.abs(n - i).toFixed(c).slice(2) : '');
};
