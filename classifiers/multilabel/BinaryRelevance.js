var hash = require("../../utils/hash");
var sprintf = require("sprintf").sprintf;
var _ = require("underscore")._;

/**
 * BinaryRelevance - Multi-label classifier, based on a collection of binary classifiers.  
 * 
 * @param opts
 *            binaryClassifierType (mandatory) - the type of the base binary classifier. 
 */
var BinaryRelevance = function(opts) {
	if (!opts.binaryClassifierType) {
		console.dir(opts);
		throw new Error("opts.binaryClassifierType not found");
	}
	this.binaryClassifierType = opts.binaryClassifierType;
	this.mapClassnameToClassifier = {};
}

BinaryRelevance.prototype = {

	/**
	 * Tell the classifier that the given sample belongs to the given labels.
	 * 
	 * @param sample
	 *            a document.
	 * @param labels
	 *            an object whose KEYS are labels, or an array whose VALUES are labels.
	 */
	trainOnline: function(sample, labels) {
		labels = hash.normalized(labels);
		for ( var positiveClass in labels) {
			this.makeSureClassifierExists(positiveClass);
			this.mapClassnameToClassifier[positiveClass].trainOnline(sample, 1);
		}
		for ( var negativeClass in this.mapClassnameToClassifier) {
			if (!labels[negativeClass])
				this.mapClassnameToClassifier[negativeClass].trainOnline(sample, 0);
		}
	},

	/**
	 * Train the classifier with all the given documents.
	 * 
	 * @param dataset
	 *            an array with objects of the format: 
	 *            {input: sample1, output: [class11, class12...]}
	 */
	trainBatch : function(dataset) {
		// this variable will hold a dataset for each binary classifier:
		var mapClassnameToDataset = {}; 

		// create positive samples for each class:
		for ( var i = 0; i < dataset.length; ++i) {
			var sample = dataset[i].input;
			//console.dir(dataset[i]);
			dataset[i].output = hash.normalized(dataset[i].output);

			var labels = dataset[i].output;
			for ( var positiveClass in labels) {
				this.makeSureClassifierExists(positiveClass);
				if (!(positiveClass in mapClassnameToDataset)) // make sure dataset for this class exists
					mapClassnameToDataset[positiveClass] = [];
				mapClassnameToDataset[positiveClass].push({
					input : sample,
					output : 1
				})
			}
		}

		// create negative samples for each class (after all labels are in the  array):
		for ( var i = 0; i < dataset.length; ++i) {
			var sample = dataset[i].input;
			var labels = dataset[i].output;
			for ( var negativeClass in this.mapClassnameToClassifier) {
				if (!(negativeClass in mapClassnameToDataset)) // make sure dataset for this class exists
					mapClassnameToDataset[negativeClass] = [];
				if (!labels[negativeClass])
					mapClassnameToDataset[negativeClass].push({
						input : sample,
						output : 0
					})
			}
		}

		// train all classifiers:
		for (var label in mapClassnameToDataset) {
			//console.dir("TRAIN class="+label);
			this.mapClassnameToClassifier[label]
					.trainBatch(mapClassnameToDataset[label]);
		}
	},

	/**
	 * Use the model trained so far to classify a new sample.
	 * 
	 * @param sample a document.
	 * @param explain - int - if positive, an "explanation" field, with the given length, will be added to the result.
	 * @param withScores - boolean - if true, return an array of [class,score], ordered by decreasing order of score.
	 *  
	 * @return an array whose VALUES are the labels.
	 */
	classify: function(sample, explain, withScores) {
		var labels = [];
		if (explain>0) {
			var positive_explanations = {};
			var negative_explanations = {};
		}
		for (var label in this.mapClassnameToClassifier) {
			var classifier = this.mapClassnameToClassifier[label];
			var classification = classifier.classify(sample, explain);
			var score = classification.classification || classification;
			if (withScores) {
				labels.push([label, score]);
			} else if (score>0.5) {
				labels.push(label);
			}
			if (classification.explanation && explain>0) {
				var explanations_string = classification.explanation.reduce(function(a,b) {
					return a + " " + b;
				}, "");
				if (classification.classification > 0.5) {
					positive_explanations[label]=explanations_string;
				} else {
					negative_explanations[label]=explanations_string;
				}
			}
		}
		if (withScores) {
			labels.sort(function(pair1, pair2) {return pair2[1]-pair1[1]});
		}
		return (explain>0?
			{
				classes: labels, 
				explanation: {
					positive: positive_explanations, 
					negative: negative_explanations,
				}
			}:
			labels);
	},

	/**
	 * Tell the classifier that the given labels will be used for the following
	 * samples, so that it will know to add negative samples to labels that do
	 * not appear.
	 * 
	 * @param labels an object whose KEYS are labels, or an array whose VALUES are labels.
	 */
	addClasses: function(labels) {
		labels = hash.normalized(labels);
		for (var label in labels) {
			if (!this.mapClassnameToClassifier[label]) {
				this.mapClassnameToClassifier[label] = new this.binaryClassifierType();
			}
		}
	},
	
	getAllClasses: function() {
		return Object.keys(this.mapClassnameToClassifier);
	},

	toJSON : function(callback) {
		var result = {};
		for ( var label in this.mapClassnameToClassifier) {
			var binaryClassifier = this.mapClassnameToClassifier[label];
			if (!binaryClassifier.toJSON) {
				console.dir(binaryClassifier);
				console.log("prototype: ");
				console.dir(binaryClassifier.__proto__);
				throw new Error("this binary classifier does not have a toJSON function");
			}
			result[label] = binaryClassifier.toJSON(callback);
		}
		return result;
	},

	fromJSON : function(json, callback) {
		for ( var label in json) {
			this.mapClassnameToClassifier[label] = new this.binaryClassifierType();
			this.mapClassnameToClassifier[label].fromJSON(json[label]);
		}
		return this;
	},
	
	// private function: 
	makeSureClassifierExists: function(label) {
		if (!this.mapClassnameToClassifier[label]) { // make sure classifier exists
			this.mapClassnameToClassifier[label] = new this.binaryClassifierType();
		}
	},
}


module.exports = BinaryRelevance;
