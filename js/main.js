var svg = d3.select("svg"),
  margin = { top: 50, right: 40, bottom: 110, left: 40 },
  margin2 = { top: 430, right: 40, bottom: 30, left: 40 },
  width = +svg.attr("width") - margin.left - margin.right,
  height = +svg.attr("height") - margin.top - margin.bottom,
  height2 = +svg.attr("height") - margin2.top - margin2.bottom;

var parseDate = d3.timeParse("%Y-%m-%d %H:%M:%S");

var x = d3.scaleTime().range([0, width]),
  x2 = d3.scaleTime().range([0, width]),
  y = d3.scaleLinear().range([height, 0]),
  y2 = d3.scaleLinear().range([height2, 0]);

var xAxis = d3.axisBottom(x),
  xAxis2 = d3.axisBottom(x2),
  yAxis = d3.axisLeft(y);

var brush = d3
  .brushX()
  .extent([
    [0, 0],
    [width, height2],
  ])
  .on("brush end", brushed);

var zoom = d3
  .zoom()
  .scaleExtent([1, Infinity])
  .translateExtent([
    [0, 0],
    [width, height],
  ])
  .extent([
    [0, 0],
    [width, height],
  ])
  .on("zoom", zoomed);

var line = d3
  .line()
  .curve(d3.curveCardinal)
  .x(function (d) {
    return x(d.date);
  })
  .y(function (d) {
    return y(d.price);
  });

var line2 = d3
  .line()
  .curve(d3.curveCardinal)
  .x(function (d) {
    return x2(d.date);
  })
  .y(function (d) {
    return y2(d.price);
  });

var line3 = d3
  .line()
  .curve(d3.curveCardinal)
  .x(function (d) {
    return d[0];
  })
  .y(function (d) {
    return d[1];
  });

svg
  .append("defs")
  .append("clipPath")
  .attr("id", "clip")
  .append("rect")
  .attr("width", width)
  .attr("height", height);

var focus = svg
  .append("g")
  .attr("class", "focus")
  .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

var context = svg
  .append("g")
  .attr("class", "context")
  .attr("transform", "translate(" + margin2.left + "," + margin2.top + ")");

var legend = svg
  .append("g")
  .attr("class", "legend")
  .attr(
    "transform",
    "translate(" + margin2.left + "," + (height - margin2.bottom + 20) + ")"
  );
  
const fisheye = d3.fisheye.circular().radius(200).distortion(2)

d3.csv("data/litecoin.csv", type5, function (error, data) {
  if (error) throw error;

  x.domain(
    d3.extent(data, function (d) {
      return d.date;
    })
  );
  y.domain([0, 4400]);
  x2.domain(x.domain());
  y2.domain(y.domain());

  focus
    .append("path")
    .datum(data)
    .attr("class", "line litecoin")
    .attr("d", line)
    .style("stroke", "rgb(31, 119, 180)");

  focus
    .append("g")
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height + ")")
    .call(xAxis);

  focus.append("g").attr("class", "axis axis--y").call(yAxis);

  context
    .append("path")
    .datum(data)
    .attr("class", "line")
    .attr("d", line2)
    .style("stroke", "#157D11");

  context
    .append("g") // x2Axis
    .attr("class", "axis axis--x")
    .attr("transform", "translate(0," + height2 + ")")
    .call(xAxis2);

  context
    .append("g") //Carré de focus
    .attr("class", "brush")
    .call(brush)
    .call(brush.move, x.range());

  svg
    .append("rect")
    .attr("class", "zoom")
    .attr("width", width)
    .attr("height", height)
    .attr("transform", "translate(" + margin.left + "," + margin.top + ")")
    .call(zoom);
});

d3.csv("data/binance.csv", type4, function (error, data) {
  if (error) throw error;

  focus
    .append("path")
    .datum(data)
    .attr("class", "line binance")
    .attr("d", line)
    .style("stroke", "rgb(44, 160, 44)");

  context
    .append("path")
    .datum(data)
    .attr("class", "line")
    .attr("d", line2)
    .style("stroke", "#000066");
});

d3.csv("data/ethereum.csv", type3, function (error, data) {
  if (error) throw error;
  focus
    .append("path")
    .datum(data)
    .attr("class", "line ethereum")
    .attr("d", line)
    .style("stroke", "rgb(214, 39, 40)");

  context
    .append("path")
    .datum(data)
    .attr("class", "line")
    .attr("d", line2)
    .style("stroke", "#FC1212");
});


svg.on("mousemove", function () {
  fisheye.focus(d3.mouse(this));
  focus.selectAll(".line").attr("d",fishline);
})

function fishline(d){

  return line3(d?.map(function(a){
    // console.log(a.name);
    a = fisheye({x:x(a.date),y:y(a.price)});
    return[a.x,a.y];
  }));

}


function brushed() {
  if (d3.event.sourceEvent && d3.event.sourceEvent.type === "zoom") return; // ignore brush-by-zoom
  var s = d3.event.selection || x2.range();
  x.domain(s.map(x2.invert, x2));
  focus.selectAll(".line").attr("d", line);
  focus.selectAll(".axis--x").call(xAxis);
  svg
    .select(".zoom")
    .call(
      zoom.transform,
      d3.zoomIdentity.scale(width / (s[1] - s[0])).translate(-s[0], 0)
    );
}

function zoomed() {
  if (d3.event.sourceEvent && d3.event.sourceEvent.type === "brush") return; // ignore zoom-by-brush
  var t = d3.event.transform;
  x.domain(t.rescaleX(x2).domain());
  focus.selectAll(".line").attr("d", line);
  focus.selectAll(".axis--x").call(xAxis);
  context.select(".brush").call(brush.move, x.range().map(t.invertX, t));
}

function type3(d) {
  d.date = parseDate(d.date);
  d.price = +d.price;
  d.name = "ethereum";
  d.y = d.price;
  d.x = d.date;
  return d;
}
function type4(d) {
  d.date = parseDate(d.date);
  d.price = +d.price;
  d.name = "binance";
  d.y = d.price;
  d.x = d.date;
  return d;
}
function type5(d) {
  d.date = parseDate(d.date);
  d.price = +d.price;
  d.name = "litecoin";
  d.y = d.price;
  d.x = d.date;
  return d;
}

Array.from(document.querySelectorAll("#radios input[type='radio']")).forEach(
  (radio) => {
    radio.addEventListener("click", function (e) {
      switch (e.target.id) {
        case "litecoin":
        case "binance":
        case "ethereum":
          d3.selectAll("path.line")
            .classed("fadeout", function () {
              return true;
            })
            .classed("highlight", function () {
              return false;
            });

          d3.selectAll("path.line." + e.target.id)
            .classed("highlight", function () {
              return true;
            })
            .classed("fadeout", function () {
              return false;
            });

          break;
        case "all":
          d3.selectAll("path.line").classed("fadeout", function () {
            return false;
          }) .classed("highlight", function () {
            return false;
          })
          break;
      }
    });
  }
);
