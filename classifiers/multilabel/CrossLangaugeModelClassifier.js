var hash = require("../../utils/hash");
var sprintf = require("sprintf").sprintf;
var _ = require("underscore")._;
var util = require("util");
var multilabelutils = require('./multilabelutils');

var CrossLanguageModel = require('languagemodel').CrossLanguageModel;
//var CrossLanguageModel = require('../../../languagemodel').CrossLanguageModel;



/**
 * Multilabel classifier based on cross-language model.
 * 
 * See https://github.com/erelsgl/languagemodel .
 * 
 * IN CONSTRUCTION
 *
 * @param opts
 *			smoothingFactor (lamda of the model)
 *          threshold (optional; default 0) - for selecting relevant/irrelevant classes.
 *          labelFeatureExtractor (optional) - function that extracts features from the output labels. 
 *
 */
var CrossLanguageModelClassifier = function(opts) {
	this.model = new CrossLanguageModel(opts);
	this.labelFeatureExtractor = opts.labelFeatureExtractor;
	this.threshold = opts.threshold || 0;
	this.allLabels = {};
	this.allLabelsFeatures = {};
}

CrossLanguageModelClassifier.prototype = {

	trainOnline: function(features, labels) {
		this.model.trainOnline(features, this.labelsToFeatures(labels));
	},

	/**
	 * Train the classifier with all the given documents.
	 * 
	 * @param dataset
	 *			an array with objects of the format: 
	 *			{input: sample1, output: [class11, class12...]}
	 */
	trainBatch : function(dataset) {
		dataset = dataset.map(function(datum) {
			return {
				input: datum.input,
				output: this.labelsToFeatures(datum.output),
			}
		}, this);
		this.model.trainBatch(dataset);
	},

	classify : function(features, explain, withScores) {
		var scoresVector = [];
		for (var labelString in this.allLabels) {
			var label = this.allLabels[labelString];
			var labelFeatures = this.allLabelsFeatures[labelString] || label;
			var similarity = -this.model.divergence(features, labelFeatures);
			scoresVector.push([label, similarity]);
		}
		scoresVector.sort(function(a,b) {return b[1]-a[1]}); // sort by decreasing score
		return multilabelutils.mapScoresVectorToMultilabelResult(scoresVector, explain, withScores, this.threshold);
	},


	/**
	 * @return an array with all possible output labels.
	 */
	getAllClasses: function() {
		return Object.keys(this.allLabels);
	},
	
	/**
	 * Internal function.
	 * 
	 * Converts an array of labels to a hash of features.
	 */
	labelsToFeatures: function(labels) {
		if (!Array.isArray(labels))  labels = [labels];
		var features = {};
		for (var i in labels) {
			var label = labels[i];
			var labelString = multilabelutils.stringifyIfNeeded(label);
			if (this.labelFeatureExtractor) {
				this.labelFeatureExtractor(label, features);
				this.allLabelsFeatures[labelString] = this.labelFeatureExtractor(label, {});
			}
			else if (_.isObject(label))
				features = util._extend(features, label);
			else 
				features[label] = label;
			this.allLabels[labelString] = label;
		}
		return features;
	},

	toJSON : function() {
		return {
			allLabels: this.allLabels,
			model: this.model.toJSON(),
		}
	},

	fromJSON : function(json) {
		this.allLabels = json.allLabels;
		this.model.fromJSON(json);
	},
}


module.exports = CrossLanguageModelClassifier;


if (process.argv[1] === __filename) {
	console.log("CrossLanguageModelClassifier demo start");
	
	var classifier = new CrossLanguageModelClassifier({
		smoothingFactor : 0.9,
		labelFeatureExtractor: null,
		threshold: -0.5,
	});

	classifier.trainBatch([
	                       {input: {i:1, want:1, aa:1}, output: {a:1}},
	                       {input: {i:1, want:1, bb:1}, output: {b:1}},
	                       {input: {i:1, want:1, cc:1}, output: {c:1}},
		]);

	//console.log(util.inspect(classifier, {depth:10}));
	
	console.log("classify:");
	console.dir(classifier.classify({i:1, want:1, aa:1, and:1, bb:1}));	

	console.log("classify with explain:");
	console.dir(classifier.classify({i:1, want:1, aa:1, and:1, bb:1}, 3));	

	console.log("classify with scores:");
	console.dir(classifier.classify({i:1, want:1, aa:1, and:1, bb:1}, 0, true));	

	console.log("classify with scores and explain:");
	console.dir(classifier.classify({i:1, want:1, aa:1, and:1, bb:1}, 3, true));	

	console.log("CrossLanguageModelClassifier demo end");
}
