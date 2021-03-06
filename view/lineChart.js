var d3 = require('d3')
	, debug = require('debug')('lineChart')

/**
* Set of functions to manage real-time line chart (tweets counter)
*
* @constructor
* 
* @param {object} svg the d3 selection
* @param {object} granularity 'm' or 's' for minute or second
* 
*/
function LineChart (svg, granularity) {

	var self = this

	if (granularity === 'm') {
		var timeRes = 60000
			, barCount = 30
			
		this.barId = 30
	}
	else {
		var timeRes = 1000
			, barCount = 60
			
		this.barId = 60

	}
	
	var svgWidth = 450
		, margin = {top: 20, right: 20, bottom: 80, left: 80}
		, width = svgWidth - margin.left - margin.right
		, height = 300 - margin.top - margin.bottom
		
	var g = svg.append("g").attr("transform", "translate(" + margin.left + "," + margin.top + ")")
	
	this.bars = g.append('g')
	
	/****************************************
	* 
	* Private methods
	* 
	****************************************/
	
	/****************************************
	* 
	* slide bars as time goes on (every new minute or second, based on granularity)
	* 
	****************************************/
	function nextTimeInterval() {

		self.timeline.shift()
		
		self.timeline.push({
			id: ++self.barId
			, count: 0
		})
		
		var rect = self.bars.selectAll('rect').data(self.timeline, function(d) {return d.id})

		rect.enter()
			.append('rect')
				.attr('x', function(d, i) {return self.x(-1)})
				.attr('y', height)
				.attr('width', width / barCount)
				.attr('height', function(d) { return height - self.y(d.count)})
				.style('fill', '#008000')
				.style('stroke', 'white')
				.style('stroke-width', '1')
			.transition()
			.duration(400)
				.attr('y', function(d) { return self.y(d.count)})

		rect.transition()
			.duration(400)
				.attr('x', function(d, i) { return self.x(i - barCount)})
				.attr('y', function(d) { return self.y(d.count)})
				.attr('height', function(d) { return height - self.y(d.count)})
				.style('fill', '#66B366')

		
		self.yAxis.call(d3.axisLeft(self.y).tickFormat(d3.format('d')).ticks(tickCountSetter(self.maxCount)))

		rect.exit().transition()
			.duration(400)
			.attr('y', height)
			.attr('height', 0)
			.attr('x', function(d, i) { return self.x(i - barCount)})
			.remove()

	}
	
	function tickCountSetter(n){
		if (n <= 10)
			return n
		else
			return 6
	}
	
	/****************************************
	* 
	* Public methods
	* 
	****************************************/
	
	/***********
	 * 
	 * Render line chart
	 *
	 * @param {object} timeline time series data
	 * 
	 ************/
	this.init = function (timeline) {
		
		this.timeline = timeline

		this.maxCount = d3.max(self.timeline, function(d) {return d.count})

		this.x = d3.scaleLinear()
			.domain([-(barCount-1), 0])
			.range([0, width])
			.nice()

		this.y = d3.scaleLinear()
			.domain([0, self.maxCount])
			.range([height, 0])
			//~ .nice()

		g.append("g")
			.attr("class", "axis axis--x")
			.attr("transform", "translate(0," + self.y(0) + ")")
			.call(d3.axisBottom(self.x).ticks(5))

		this.yAxis = g.append("g")
			.attr("class", "axis axis--y")
			.call(d3.axisLeft(self.y).ticks(6))
		
		this.bars.selectAll('rect').data(self.timeline, function(d) {return d.id})
			.enter()
			  .append('rect')
				.attr('x', function(d, i) { return self.x(i - barCount)})
				.attr('y', function(d) { return self.y(d.count)})
				.attr('width', width / barCount)
				.attr('height', function(d) { return height - self.y(d.count)})
				.style('fill', function(d, i) { return i === barCount-1? '#008000' : '#66B366'})
				.style('stroke', 'white')
				.style('stroke-width', '1')
				
		// launch chart refresh at every time interval
		setInterval(nextTimeInterval, timeRes)
	}
	
	/***********
	 * 
	 * Add new tweet to latest bar
	 *
	 ************/
	this.addTweet = function() {

		if (typeof this.timeline !== 'undefined') {

			this.timeline[self.timeline.length-1].count++
			
			this.maxCount = d3.max(self.timeline, function(d) {return d.count})
			
			this.y.domain([0, self.maxCount])
			
			this.yAxis.call(d3.axisLeft(self.y).tickFormat(d3.format('d')).ticks(tickCountSetter(self.maxCount)))

			this.bars.selectAll('rect')
				.data(self.timeline, function(d) {return d.id})
					.transition()
					.delay(400)
					  .attr('y', function(d) { return self.y(d.count) })
					  .attr('height', function(d) { return height - self.y(d.count)})
		}
	}

	return this	
}

module.exports = LineChart
