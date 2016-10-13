var debug = require('debug')('tweetsModel')
	, d3 = require('d3')

/********************************************************
* Tweets datastore
* 
* @constructor
* 
*********************************************************/
function Tweets(storage) {

	var self = this

	if (storage.keys().indexOf('tweets') === -1) {
		// no tweets are already stored
		self.tweets = []
		// initialize tweets storage to an empty array in case 
		storage.setItemSync('tweets', [])
	}
	else {
		// cache persisted tweets
		self.tweets = storage.getItemSync('tweets')
	}
	
	self.tweetStats = {
		replyCount: 0
		, totalCount: 0
	}
	
	// compute tweet statistics
	calculateTweetStats()

	// compute tweets time series
	self.tweetsPerMinute = computeTimeline('m')

	// update tweets per minute statistics every minute
	setInterval(function() {
		computeTimeline('m')
	}, 60000)
	
	// initiate a cache cleanup at the next round hour
	// based on http://stackoverflow.com/a/19847644/1006854
	var now = new Date()
		, delay = 60 * 60 * 1000

	setTimeout(cleanCache, delay - (now.getMinutes() * 60 + now.getSeconds()) * 1000 + now.getMilliseconds())


	/********************************************************
	* 
	* Private functions
	* 
	*********************************************************/

	/**
	* 
	* Remove all cached tweets older than 24 hours
	*
	* @private
	* 
	*/
	function cleanCache() {
		
		// schedule next execution in an hour
		setTimeout(cleanCache, delay)
		
		console.log('before cache clean', self.tweets.length)
		
		var yesterday = new Date()
		yesterday.setDate(yesterday.getDate() - 1)
	
		self.tweets = self.tweets.filter(function(tweet, ix){
			
			return new Date(Date.parse(tweet.created_at)) > yesterday
				
		})
	
		console.log('after cache clean', self.tweets.length)
	
		storage.setItem('tweets', self.tweets)
		
		calculateTweetStats()
		
	}

	/**
	* 
	* Calculate tweet time series data
	* 
	* @param {string} granularity desired ('m', 's')
	* 
	* @return {object} tweets count time series
	*
	* @private
	* 
	*/	
	function computeTimeline (granularity){
	
		if (granularity === 'm') {
			var timeRes = 60000
				, barCount = 30
		}
		else {
			var timeRes = 1000
				, barCount = 60
		}
		
		var ts = Date.now()
			, position = self.tweets.length-1
			, allValidTweetsProcessed = false
			, barId = 0
			
		// initialize data structure
		var tweetsTimeline = d3.range(barCount).map(function(d, i) {
			return {
				id: ++barId // id to be used as data key by d3 in the client
				, count: 0
			}
		})
		
		if (position !== -1) {
			// update count per minute/second until we reach tweets older than 60 seconds / 30 minutes ago
			while(!allValidTweetsProcessed && position) {
				
				var barIndex = Math.floor((ts - Date.parse(self.tweets[position].created_at)) / timeRes)
				
				//~ if (granularity == 'm') {
					//~ console.log('ts', ts)
					//~ console.log('created_at', self.tweets[position].created_at)
					//~ console.log('Date.parse(self.tweets[position].created_at)', Date.parse(self.tweets[position].created_at))
					//~ console.log('(ts - Date.parse(self.tweets[position].created_at)', (ts - Date.parse(self.tweets[position].created_at)))
					//~ console.log('barIndex', barIndex)
					//~ 
				//~ }
				
				if (barIndex > barCount-1)
				// the tweet is older than the monitored time interval, consider stats calculation done
					allValidTweetsProcessed = true
				else {
					tweetsTimeline[barCount-1 - barIndex].count += 1				
					position--
				}
			}
		}
		
		//~ if (granularity == 'm') {
			//~ console.log(JSON.stringify(tweetsTimeline))
		//~ }
		
		
		return tweetsTimeline
		
	}

	/**
	* 
	* Calculate tweet statistics
	*
	* @private
	* 
	*/	
	function calculateTweetStats(){
		
		self.tweetStats.replyCount = 0
		self.tweetStats.hashtagCount = 0
		self.tweetStats.linkCount = 0
		self.tweetStats.mentionCount = 0
		self.tweetStats.mediaCount = 0
		
		self.tweets.forEach(function(t) {
			
			if(t.is_reply)
				self.tweetStats.replyCount++
			
			if(t.has_hashtag)
				self.tweetStats.hashtagCount++
			
			if(t.has_link)
				self.tweetStats.linkCount++
			
			if(t.has_mention)
				self.tweetStats.mentionCount++
			
			if(t.has_media)
				self.tweetStats.mediaCount++
				
		})
		
		self.tweetStats.totalCount = self.tweets.length
		
	}
		
	/**
	* 
	* count new tweet in the tweets per minute time series data
	*
	* @private
	* 
	*/	
	function updateTimeline(){
		self.tweetsPerMinute[self.tweetsPerMinute.length-1].count++
	}

	/**
	* 
	* update tweet statistics
	*
	* @param {object} tweet new tweet
	* 
	* @private
	* 
	*/	
	function updateTweetStats(tweet){

		if (tweet.is_reply)
			self.tweetStats.replyCount++
		
		self.tweetStats.totalCount++
		
	}

	/********************************************************
	* 
	* Public functions
	* 
	*********************************************************/

	// record a new tweet
	this.add = function(tweet) {
		//~ console.log('adding tweet', tweet)
		self.tweets.push(tweet)
		
		storage.setItem('tweets', self.tweets)
		
		updateTweetStats(tweet)
		
	}

	// retrieve all tweets
	this.getAll = function() {
		return self.tweets
	}
	
	// retrieve tweet statistics
	this.getStats = function() {
		return self.tweetStats
	}
	
	// retrieve tweet statistics
	this.getTimelines = function() {
		
		// compute per second stats on the fly
		var perSecond = computeTimeline('s')
				
		return {
			perSecond: perSecond
			, perMinute: self.tweetsPerMinute
		}
		
	}
	
	

}

module.exports = Tweets
