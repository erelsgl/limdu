var _ = require("underscore")._;

/**
 * A multi-class single-label Bayes classifier.
 *
 * @author Erel Segal-Halevi based on code by Heather Arthur (https://github.com/harthur/classifier)
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
	this.normalizeOutputProbabilities = options.normalizeOutputProbabilities||false;
	this.calculateRelativeProbabilities = options.calculateRelativeProbabilities||false;

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
	 * @param document [string] a training sample - a feature-value hash: {feature1: value1, feature2: value2, ...}
	 * @param category [string] the correct category of this sample.
	 */
	trainOnline: function(document, category) {
		this.incDocCounts([{input: document, output: category}]);
	},

	/**
	 * Train the classifier with all the given documents.
	 * @param data an array with objects of the format: {input: sample1, output: category1}
	 * where sample1 is a feature-value hash: {feature1: value1, feature2: value2, ...}
	 */
	trainBatch: function(data) {
		this.incDocCounts(data);
	},

	/**
	 * Ask the classifier what category the given document belongs to.
	 * @param document a hash {feature1: value1, feature2: value2, ...}
	 * @return the most probable category of this sample.
	 * If explain>0, also return the probability of each category.
	 */
	classify: function(document, explain) {
		if (!_.isObject(document)) {
			throw new Error("document should be a feature-value hash, but it is "+JSON.stringify(document));
		}
		var probs = this.getProbsSync(document);

		var max = this.bestMatch(probs);
		if (explain>0) {
			return {
				classes: max.category,
				explanation: probs.map(function(pair) {
					return pair[0]+": "+pair[1]
				})
			};
		} else {
			return max.category;
		}
	},

	/**
	 * A subroutine used for classification.
	 * Gets the probabilities of the words in the given sentence.
	 * @param document a hash {feature1: value1, feature2: value2, ...}
	 * Values are numeric and represent number of occurences.
	 */
	getProbsSync: function(document) {
		var cats = this.getCats(); // a hash with the possible categories: { 'cat1': 1, 'cat2': 1 }
		var counts = this.getWordCounts(Object.keys(document), cats); // For each word encountered during training, the counts of times it occurred in each category.

		var probs = this.getCatProbs(cats, document, counts); // The probabilities that the given document belongs to each of the categories, i.e.: { 'cat1': 0.1875, 'cat2': 0.0625 }

		if (this.normalizeOutputProbabilities) {
			var sum = _(probs).reduce(function(memo, num) { return memo + num; }, 0);
			for (var cat in probs)
				probs[cat] = probs[cat]/sum;
		}

		var pairs = _.pairs(probs);   // pairs of [category,probability], for all categories that appeared in the training set.
		//console.dir(pairs);
		if (pairs.length==0) {
			return {category: this.default, probability: 0};
		}
		pairs.sort(function(a,b) {   // sort by decreasing prob
			return b[1]-a[1];
		});

		return pairs;
	},

	/**
	 * Used for classification.
	 * @param pairs [[category,probability],...]
	 * @return{category: most-probable-category, probability: its-probability}
	 */
	bestMatch: function(pairs) {
		var maxCategory = pairs[0][0];
		var maxProbability = pairs[0][1];

		if (pairs.length>1) {
			var nextProbability = pairs[1][1];
			var threshold = this.thresholds[maxCategory] || this.globalThreshold;
			if (nextProbability * threshold > maxProbability)
				maxCategory = this.default; // not greater than other category by enough
			if (this.calculateRelativeProbabilities)
				maxProbability /= nextProbability;
		}

		return {
			category: maxCategory,
			probability: maxProbability
		};
	},


	toJSON: function(callback) {
		return this.backend.toJSON(callback);
	},

	fromJSON: function(json, callback) {
		this.backend.fromJSON(json, callback);
	},

	getCats: function(callback) {
			return this.backend.getCats(callback);
	},



	/*
	 *
	 *	Internal functions (should be private):
	 *
	 */

	wordProb: function(word, cat, cats, wordCounts) {
		// times word appears in a doc in this cat / docs in this cat
		var probWordGivenCat = (wordCounts[cat] || 0) / cats[cat];

		var totalWordCount = _(cats).reduce(function(sum, p, cat) {
			return sum + (wordCounts[cat] || 0);
		}, 0, this);
		// get weighted average with assumed so prob won't be extreme on rare words
		var modifiedProbGivenCat = (this.weight * this.assumed + totalWordCount * probWordGivenCat) / (this.weight + totalWordCount);

		//console.log("word="+word+" cat="+cat+" probWordGivenCat="+probWordGivenCat+" totalWordCount="+totalWordCount+" modifiedProbGivenCat="+modifiedProbGivenCat)
		return modifiedProbGivenCat
	},

	getCatProbs: function(cats, document, counts) {
		var numDocs = _(cats).reduce(function(sum, count) {
			return sum + count;
		}, 0);  // total number of training samples in all categories

		var probs = {};
		_(cats).each(function(catCount, cat) {
			var catPriorProb = (catCount || 0) / numDocs;

			// The probability to see a document is the product
			//     of the probability to see each word in the document.
			var docProb = _(Object.keys(document)).reduce(function(prob, word) {
				var wordCounts = counts[word] || {};
				var probWordGivenCat = this.wordProb(word, cat, cats, wordCounts);
				var probWordsGivenCat = Math.pow(probWordGivenCat, document[word]);
				//console.log("probWordGivenCat="+probWordGivenCat+" probWordsGivenCat="+probWordsGivenCat+" document[word]="+document[word])
				return prob * probWordsGivenCat;
			}, 1, this);
			//console.log("docProb="+docProb)

			// the probability this doc is in this category
			probs[cat] = catPriorProb * docProb;
		}, this);
		return probs;
	},


	getWordCounts: function(words, cats, callback) {
			return this.backend.getWordCounts(words, cats, callback);
	},

	/**
	 * Increment the feature counts.
	 * @param data an array with objects of the format: {input: sample1, output: class1}
	 * where sample1 is a feature-value hash: {feature1: value1, feature2: value2, ...}
	 */
	incDocCounts: function(samples, callback) {
			// accumulate all the pending increments
			var wordIncs = {};
			var catIncs = {};
			samples.forEach(function(sample) {
				var cat = sample.output;
				//if (_.isObject(cat))
				//	cat = JSON.stringify(cat);
				catIncs[cat] = catIncs[cat] ? catIncs[cat] + 1: 1;

				var features = sample.input;
				for (var feature in features) {
					wordIncs[feature] = wordIncs[feature] || {};
					wordIncs[feature][cat] = wordIncs[feature][cat] || 0;
					wordIncs[feature][cat] += features[feature];
				}
			}, this);

			return this.backend.incCounts(catIncs, wordIncs, callback);
	},

	setThresholds: function(thresholds) {
			this.thresholds = thresholds;
	},

}

module.exports = Bayesian;
