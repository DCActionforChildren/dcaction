var sm = {};

sm.packer = function() {
   var packer = {},
       intervalId = 0,
       sim = null,
       nodes = [],
       startPos = [],
       elements = [];

   packer.elements = function(e) {
       if (!arguments.length)  return elements;

       elements = e;

       return packer;
   };

   packer.animating = false;

   packer.start = function() {

       nodes = [];

       for (var i = 0; i < elements.length; i++) {
           var at = elements[i].getAttribute("transform");
           var ax = Number(at.split("(")[1].split(",")[0]), ay = Number(at.split(",")[1].split(" ").join("").split(")").join(""));
           var ar = elements[i].getAttribute("r");
           var n = {
               x: ax,
               y: ay,
               r: parseFloat(ar),
               id: i,
               //sel: elements[i].getAttribute('class').search('sel_primary') !== -1 ? true : false
           };

           //console.log(elements[i].getAttribute('class').search('sel_primary'), n.sel);

           nodes[i] = n;

           if (!startPos[i]) {
             startPos[i] = { x: ax, y: ay };
           }
       }

       var j = 0;
       if (intervalId) {
	       clearInterval(intervalId);
       }
       intervalId = setInterval(function() {
           packer.animating = true;
           if (j++ > 40) {
               clearInterval(intervalId);
               intervalId = null;
               packer.animating = false;
           }

           draw();
       }, 10);

       return packer;
   };

   var draw = function() {
       for (var i = 0; i < elements.length; i++) {
           for (var j = 0; j < elements.length; j++) {
               if (i == j)
                   continue;

               pack(nodes[i], nodes[j]);
           }

           var e = elements[i];
           var n = nodes[i];
           var s = startPos[i];

		 if (Math.abs(n.x - s.x) > 5) {
			n.x += (s.x - n.x) * .1;
		 }
		 if (Math.abs(n.y - s.y) > 5) {
			n.y += (s.y - n.y) * .1;
		 }

      if(!isNaN(n.x) && !isNaN(n.y)) {
	     e.setAttribute("transform", "translate(" + n.x + "," + n.y + ")");
      }
		   e.setAttribute("r", n.r);
       }
   };

   // circle pack
   var pack = function(a, b) {
       if (intersects(a, b)) {
           v.x = a.x - b.x;
           v.y = a.y - b.y;
           var d = (v.x * v.x) + (v.y * v.y);

           v.normalize();
           v.mult((a.r + b.r + 5 - Math.sqrt(d)) * .5);

		   if (!a.sel) {
			   a.x += v.x;
	           a.y += v.y;
		   }

		   if (!b.sel) {
			   b.x -= v.x;
	           b.x -= v.y;
		   }

       }
   };

   // vector
   var v = {};
   v.normalize = function() {
       v.magnitude = Math.sqrt((v.x * v.x) + (v.y * v.y));

       v.x = v.x / v.magnitude;
       v.y = v.y / v.magnitude;
   };

   v.mult = function(m) {
       v.x *= m;
       v.y *= m;
   };

   var distance = function(ax, ay, bx, by) {
      var dx = ax - bx;
      var dy = ay - by;

      return Math.sqrt((dx * dx) + (dy * dy));
   };

   var intersects = function(a, b) {
      var d  = distance(a.x, a.y, b.x, b.y);

      return (d < (a.r + b.r + 5));
   };

   return packer;
};
