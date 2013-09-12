var hash = require("../../utils/hash");
var sprintf = require("sprintf").sprintf;
var _ = require("underscore")._;
var util = require("util");
var CrossLanguageModel = require('../../../languagemodel').CrossLanguageModel;
console.dir(CrossLanguageModel);

/**
 * Multilabel classifier based on cross-language model.
 * 
 * IN CONSTRUCTION
 *
 * @param opts
 *			smoothingFactor (lamda)
 */
var CrossLanguageModelClassifier = function(opts) {
	this.model = new CrossLanguageModel(opts);
}

CrossLanguageModelClassifier.prototype = {

	/**
	 * Train the classifier with all the given documents.
	 * 
	 * @param dataset
	 *			an array with objects of the format: 
	 *			{input: sample1, output: [class11, class12...]}
	 */
	trainBatch : function(dataset) {
		this.model.trainBatch(dataset);
	},
	
	trainOnline: function(features, classes) {
		this.model.trainOnline(features, classes);
	},

	classify : function(features, explain, withScores) {
		var sims = this.model.similarities(features);

//		var results;
//		if (withScores) {
//			results = ranks;
//		} else {
//			results = [];
//			ranks.forEach(function(pair) {
//				if (pair[1]>0)
//					results.push(pair[0]);
//			});
//		}
//		return explain>0? 	{
//			classes: results, 
//			explanation: ranks.map(function(pair) {return pair[0]+": "+pair[1];})
//		}: 
//		results; 
		return sims;
	},

	getAllClasses: function() {
		return Object.keys(this.weights);
	},

	toJSON : function(callback) {
		return {
			weights_sum: this.weights_sum,
			weights: this.weights,
			num_iterations: this.num_iterations,
		}
	},

	fromJSON : function(json, callback) {
		this.weights_sum = json.weights_sum;
		this.weights = json.weights;
		this.num_iterations = json.num_iterations;
	},
}


module.exports = CrossLanguageModelClassifier;


if (process.argv[1] === __filename) {
	console.log("CrossLanguageModelClassifier demo start");
	
	var classifier = new CrossLanguageModelClassifier({
		smoothingFactor : 0.9,
	});
	
	classifier.trainBatch([
	                       {input: {i:1, want:1, aa:1}, output: {a:1}},
	                       {input: {i:1, want:1, bb:1}, output: {b:1}},
	                       {input: {i:1, want:1, cc:1}, output: {c:1}},
		]);

	console.dir(classifier.classify({i:1, want:1, aa:1, and:1, bb:1}));	
	
	console.log("CrossLanguageModelClassifier demo end");
}
