var hash = require("../../utils/hash");
var sprintf = require("sprintf").sprintf;
var _ = require("underscore")._;
var util = require("util");
var multilabelutils = require('./multilabelutils');

var CrossLanguageModel = require('languagemodel').CrossLanguageModel;



/**
 * Multilabel classifier based on cross-language model.
 * 
 * See https://github.com/erelsgl/languagemodel .
 *
 * @param opts
 *			smoothingCoefficient (lamda of the model)
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

	/**
	 * Train the classifier with the given input features and the given array of output labels.
	 * 
	 * @note In the original paper, training was apparently done with a single output label per training instance. 
	 * It is not clear how to train when there are multiple   output labels per training instance.
	 * I asked: "suppose there is an input sentence "Where is the robot and how do I use it?" and it is labeled with two different output sentences: "The robot is there" and "Read the instructions".   What exactly do you put in the training set in this case?"
	 * And Anton Leusky replied: "in your example, both labels are in the training set. The goal is to have the classifier to rank these labels above all others for question "Where is the robot and how do I use it?" The order in which the correct labels are ranked is irrelevant. "
	 */
	trainOnline: function(features, labels) {
		this.model.trainOnline(
			features, // input features
			this.labelsToFeatures(labels)); // output features
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
			var labelFeatures = this.allLabelsFeatures[labelString];
			if (!labelFeatures)
				throw new Error("label features for "+labelString+" are undefined");
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
	 * Converts an array of output labels to a hash of features.
	 */
	labelsToFeatures: function(labels) {
		if (!Array.isArray(labels))  labels = [labels];
		var features = {};
		for (var i in labels) {
			var label = labels[i];
			var labelString = multilabelutils.stringifyIfNeeded(label);
			var labelFeatures = {};
			if (this.labelFeatureExtractor) {
				this.labelFeatureExtractor(label, labelFeatures);
			} else if (_.isObject(label)) {
				labelFeatures = label;
			} else {
				labelFeatures[label] = true;
			}
			this.allLabels[labelString] = label;
			this.allLabelsFeatures[labelString] = labelFeatures;
			features = util._extend(features, labelFeatures);
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
		smoothingCoefficient : 0.9,
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
