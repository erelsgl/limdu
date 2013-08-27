var _ = require("underscore")._;

/**
 * A multi-class Bayes classifier.
 * 
 * @param options
 */
var Bayesian = function(options) {
	options = options || {}
	this.thresholds = options.thresholds || {};
	this.globalThreshold = options.globalThreshold || 1;
	this.default = options.default || 'unclassified';
	this.weight = options.weight || 1;
	this.assumed = options.assumed || 0.5;

	var backend = options.backend || { type: 'memory' };
	switch(backend.type.toLowerCase()) {
		case 'redis':
			//this.backend = new (require("./backends/redis").RedisBackend)(backend.options);
			throw new Error("Redis backend support was dropped, in order to remove dependencies");
			break;
		case 'localstorage':
			this.backend = new (require("./backends/localStorage")
										 .LocalStorageBackend)(backend.options);
			break;
		default:
			this.backend = new (require("./backends/memory").MemoryBackend)();
	}
}


Bayesian.prototype = {

	/**
	 * Tell the classifier that the given document belongs to the given category.
	 * @param doc [string] a training sample - a feature-value hash: {feature1: value1, feature2: value2, ...} 
	 * @param cat [string] the correct class of this sample.
	 */
	trainOnline: function(doc, cat) {
		this.incDocCounts([{input: doc, output: cat}]);
	},

	/**
	 * Train the classifier with all the given documents.
	 * @param data an array with objects of the format: {input: sample1, output: class1}
	 * where sample1 is a feature-value hash: {feature1: value1, feature2: value2, ...} 
	 */
	trainBatch: function(data) {
		this.incDocCounts(data);
	},
	
	/**
	 * Ask the classifier what category the given document belongs to.
	 * @param doc [string] a sentence.
	 * @return the most probable class of this sample.
	 */
	classify: function(doc, explain) {
		var probs = this.getProbsSync(doc);
		var max = this.bestMatch(probs);
		return (explain>0? max: max.category);
	},

	/**
	 * Used for classification.
	 * Get the probabilities of the words in the given sentence.
	 * @param doc a hash {feature1: value1, feature2: value2, ...}
	 */
	getProbsSync : function(doc) {
		var words = Object.keys(doc); // an array with the unique words in the text, for example: [ 'free', 'watches' ]
		var cats = this.getCats(); // a hash with the possible categories: { 'cat1': 1, 'cat2': 1 }
		var counts = this.getWordCounts(words, cats); // For each word encountered during training, the counts of times it occured in each category. 
		var probs = this.getCatProbs(cats, words, counts); // The probabilities that the given document belongs to each of the categories, i.e.: { 'cat1': 0.1875, 'cat2': 0.0625 }
		return probs;
	},

	/**
	 * Used for classification.
	 * Get the most probable category.
	 */
	bestMatch : function(probs) {
		//console.dir(probs);
		var max = _(probs).reduce(function(max, prob, cat) {
			return max.probability > prob ? max : {category: cat, probability: prob};
		}, {probability: 0});

		var category = max.category || this.default;
		var threshold = this.thresholds[max.category] || this.globalThreshold;

		_(probs).map(function(prob, cat) {
		 if (!(cat == max.category) && prob * threshold > max.probability) {
			max.category = this.default; // not greater than other category by enough
		 }
		}, this);

		return max;
	},
	
	
	toJSON : function(callback) {
		return this.backend.toJSON(callback);
	},

	fromJSON : function(json, callback) {
		this.backend.fromJSON(json, callback);
		return this;
	},

	getCats : function(callback) {
			return this.backend.getCats(callback);
	},
	
	
	
	/*
	 *
	 *	Internal functions (should be private): 
	 *	
	 */
	
	wordProb : function(word, cat, cats, counts) {
		// times word appears in a doc in this cat / docs in this cat
		var prob = (counts[cat] || 0) / cats[cat];

		// get weighted average with assumed so prob won't be extreme on rare words
		var total = _(cats).reduce(function(sum, p, cat) {
			return sum + (counts[cat] || 0);
		}, 0, this);
		return (this.weight * this.assumed + total * prob) / (this.weight + total);
	},

	getCatProbs : function(cats, words, counts) {
		var numDocs = _(cats).reduce(function(sum, count) {
			return sum + count;
		}, 0);

		var probs = {};
		_(cats).each(function(catCount, cat) {
			var catProb = (catCount || 0) / numDocs;

			var docProb = _(words).reduce(function(prob, word) {
				var wordCounts = counts[word] || {};
				return prob * this.wordProb(word, cat, cats, wordCounts);
			}, 1, this);

			// the probability this doc is in this category
			probs[cat] = catProb * docProb;
		}, this);
		return probs;
	},
	
	
	getWordCounts : function(words, cats, callback) {
			return this.backend.getWordCounts(words, cats, callback);
	},

	/**
	 * Increment the feature counts. 
	 * @param data an array with objects of the format: {input: sample1, output: class1}
	 * where sample1 is a feature-value hash: {feature1: value1, feature2: value2, ...} 
	 */
	incDocCounts : function(samples, callback) {
			// accumulate all the pending increments
			var wordIncs = {};
			var catIncs = {};
			samples.forEach(function(sample) {
				var cat = sample.output;
				catIncs[cat] = catIncs[cat] ? catIncs[cat] + 1 : 1;

				var features = sample.input;
				for (var feature in features) {
					wordIncs[feature] = wordIncs[feature] || {};
					wordIncs[feature][cat] = wordIncs[feature][cat] || 0;
					wordIncs[feature][cat] += features[feature];
				}
			}, this);

			return this.backend.incCounts(catIncs, wordIncs, callback);
	},

	setThresholds : function(thresholds) {
			this.thresholds = thresholds;
	},

}

module.exports = Bayesian;
