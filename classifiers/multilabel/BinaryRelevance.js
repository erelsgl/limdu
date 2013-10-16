var hash = require("../../utils/hash");
var sprintf = require("sprintf").sprintf;
var _ = require("underscore")._;
var multilabelutils = require('./multilabelutils');

/**
 * BinaryRelevance - Multi-label classifier, based on a collection of binary classifiers. 
 * Also known as: One-vs-All.
 * 
 * @param opts
 *            binaryClassifierType (mandatory) - the type of the base binary classifier. There is one such classifier per label. 
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
		labels = multilabelutils.normalizeOutputLabels(labels);
		for (var l in labels) {
			var positiveLabel = labels[l];
			this.makeSureClassifierExists(positiveLabel);
			this.mapClassnameToClassifier[positiveLabel].trainOnline(sample, 1);
		}
		for (var negativeLabel in this.mapClassnameToClassifier) {
			if (labels.indexOf(negativeLabel)<0)
				this.mapClassnameToClassifier[negativeLabel].trainOnline(sample, 0);
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
		for (var d in dataset) {
			var sample = dataset[d].input;
			dataset[d].output = multilabelutils.normalizeOutputLabels(dataset[d].output);
			var labels = dataset[d].output;

			for (var l in labels) {
				var positiveLabel  = labels[l];
				this.makeSureClassifierExists(positiveLabel);
				if (!(positiveLabel in mapClassnameToDataset)) // make sure dataset for this class exists
					mapClassnameToDataset[positiveLabel] = [];
				mapClassnameToDataset[positiveLabel].push({
					input : sample,
					output : 1
				})
			}
		}

		// create negative samples for each class (after all labels are in the array):
		for (var d in dataset) {
			var sample = dataset[d].input;
			var labels = dataset[d].output;
			for (var negativeLabel in this.mapClassnameToClassifier) {
				if (!(negativeLabel in mapClassnameToDataset)) // make sure dataset for this class exists
					mapClassnameToDataset[negativeLabel] = [];
				if (labels.indexOf(negativeLabel)<0)
					mapClassnameToDataset[negativeLabel].push({
						input : sample,
						output : 0
					});
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
			if (withScores) {
				var explanations = [];
			} else {
				var positive_explanations = {};
				var negative_explanations = {};
			}
		}
		for (var label in this.mapClassnameToClassifier) {
			var classifier = this.mapClassnameToClassifier[label];
			var scoreWithExplain = classifier.classify(sample, explain, withScores);
			var score = scoreWithExplain.explanation?  scoreWithExplain.classification: scoreWithExplain;

		
			var explanations_string = ((scoreWithExplain.explanation && explain>0)?
				// cannot use .join here
					scoreWithExplain.explanation.reduce(function(a,b) {
						return a + " " + b;
					}, ""):
					null);
			
			if (withScores) {
				var labelAndScore = [label, score];
				if (explanations_string) labelAndScore.push(explanations_string);
				labels.push(labelAndScore);
			} else if (score>0.5) {
				labels.push(label);
				if (explanations_string) positive_explanations[label]=explanations_string;
			} else {
				if (explanations_string) negative_explanations[label]=explanations_string;
			}
		}
		if (withScores) {
			labels.sort(function(pair1, pair2) {return pair2[1]-pair1[1]});
			if (explain>0) {
				var explanations = [];
				labels.forEach(function(datum) {
					explanations.push(datum[0]+": score="+JSON.stringify(datum[1])+" features="+datum[2]);
					datum.pop();
				});
			}
		}
		return (explain>0?
			{
				classes: labels, 
				explanation: withScores? explanations: {
					positive: positive_explanations, 
					negative: negative_explanations,
				}
			}:
			labels);
	},
	
	getAllClasses: function() {
		return Object.keys(this.mapClassnameToClassifier);
	},
	
	/**
	 * Link to a FeatureLookupTable from a higher level in the hierarchy (typically from an EnhancedClassifier), used ONLY for generating meaningful explanations. 
	 */
	setFeatureLookupTable: function(featureLookupTable) {
		//console.log("BR setFeatureLookupTable "+featureLookupTable);
		this.featureLookupTable = featureLookupTable;
		for (var label in this.mapClassnameToClassifier)
			if (featureLookupTable && this.mapClassnameToClassifier[label].setFeatureLookupTable)
				this.mapClassnameToClassifier[label].setFeatureLookupTable(featureLookupTable);
	},

	toJSON : function() {
		var result = {};
		for (var label in this.mapClassnameToClassifier) {
			var binaryClassifier = this.mapClassnameToClassifier[label];
			if (!binaryClassifier.toJSON) {
				console.dir(binaryClassifier);
				console.log("prototype: ");
				console.dir(binaryClassifier.__proto__);
				throw new Error("this binary classifier does not have a toJSON function");
			}
			result[label] = binaryClassifier.toJSON();
		}
		return result;
	},

	fromJSON : function(json) {
		for (var label in json) {
			this.mapClassnameToClassifier[label] = new this.binaryClassifierType();
			this.mapClassnameToClassifier[label].fromJSON(json[label]);
		}
	},
	
	// private function: 
	makeSureClassifierExists: function(label) {
		if (!this.mapClassnameToClassifier[label]) { // make sure classifier exists
			this.mapClassnameToClassifier[label] = new this.binaryClassifierType();
			if (this.featureLookupTable && this.mapClassnameToClassifier[label].setFeatureLookupTable)
				this.mapClassnameToClassifier[label].setFeatureLookupTable(this.featureLookupTable);
			
		}
	},
}


module.exports = BinaryRelevance;
