var hash = require("../../utils/hash");
var sprintf = require("sprintf").sprintf;
var _ = require("underscore")._;


/**
 * HOMER - Hierarchy Of Multilabel classifiERs. See:
 * 
 * Tsoumakas Grigorios, Katakis Ioannis, Vlahavas Ioannis. Effective and Efficient Multilabel Classification in Domains with Large Number of Labels in Proc. ECML/PKDD 2008 Workshop on Mining Multidimensional Data (MMD'08):XX 2008.
 * http://www.citeulike.org/user/erelsegal-halevi/tag/homer
 * 
 * @param opts
 *            multilabelClassifierType (mandatory) - the type of the multilabel classifier used in each level of the hierarchy.
 *            getClusterByDepth (optional) - a function that receives a label and returns a cluster-label, according to the level in the hierarchy. 
 */
var Homer = function(opts) {
	opts = opts || {};
	if (!('multilabelClassifierType' in opts)) {
		console.dir(opts);
		throw new Error("opts must contain multilabelClassifierType");
	}
	if (!opts.multilabelClassifierType) {
		console.dir(opts);
		throw new Error("opts.multilabelClassifierType is null");
	}
	this.multilabelClassifierType = opts.multilabelClassifierType;
	
	this.splitLabel = opts.splitLabel || function(label)      {return label.split(/:/);}
	this.joinLabel  = opts.joinLabel  || function(superlabel) {return superlabel.join(":");}
	
	this.root = {
		superlabelClassifier: new this.multilabelClassifierType(),
		mapSuperlabelToBranch: {}
	}
}

Homer.prototype = {
		
	/**
	 *  Recursive internal subroutine of trainOnline.
	 *  @param splitLabels an array of arrays: each internal array represents the parts of a single label.
	 */
	trainOnlineRecursive: function(sample, splitLabels, treeNode, depth) {
		var superlabels = {};
		for (var i in splitLabels) {
			var superlabel = splitLabels[i].slice(0,depth).join(":");
			superlabels[superlabel] = true;
		}

		treeNode.superlabelClassifier.trainOnline(sample, superlabels);
		for (var superlabel in superlabels) {
			if (!(superlabel in treeNode.mapSuperlabelToBranch)) {
				treeNode.mapSuperlabelToBranch[superlabel] = {
					superlabelClassifier: new this.multilabelClassifierType(),
					mapSuperlabelToBranch: {}
				}
			}
			this.trainOnlineRecursive(sample, labels, treeNode.mapSuperlabelToBranch[superlabel], depth+1);
		}
	},

	/**
	 * Tell the classifier that the given sample belongs to the given classes.
	 * 
	 * @param sample
	 *            a document.
	 * @param classes
	 *            an object whose KEYS are classes, or an array whose VALUES are classes.
	 */
	trainOnline: function(sample, labels) {
		var splitLabels = normalizeLabels(labels).map(this.splitLabel);
		return this.trainOnlineRecursive(sample, splitLabels, this.root, /*depth=*/1);
	},

	
	/**
	 *  Recursive internal subroutine of trainBatch.
	 */
	trainBatchRecursive: function(dataset, treeNode, depth) {
		var superlabels = {};
		for (var label in labels) {
			var superlabel = this.getSuperlabel(label, depth);
			superlabels[superlabel] = true;
		}
		
		treeNode.superlabelClassifier.trainOnline(sample, superlabels);
		for (var superlabel in superlabels) {
			if (!(superlabel in treeNode.mapSuperlabelToBranch)) {
				treeNode.mapSuperlabelToBranch[superlabel] = {
					superlabelClassifier: new this.multilabelClassifierType(),
					mapSuperlabelToBranch: {}
				}
			}
			this.trainBatchRecursive(sample, labels, treeNode.mapSuperlabelToBranch[superlabel], depth+1);
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
		return this.trainBatchRecursive(dataset, this.root, /*depth=*/1);
	},

	/**
	 * Use the model trained so far to classify a new sample.
	 * 
	 * @param sample a document.
	 * @param explain - int - if positive, an "explanation" field, with the given length, will be added to the result.
	 *  
	 * @return an array whose VALUES are classes.
	 */
	classify : function(sample, explain) {
		var classes = {};
		if (explain>0) {
			var positive_explanations = {};
			var negative_explanations = {};
		}
		for (var aClass in this.mapClassnameToClassifier) {
			var classifier = this.mapClassnameToClassifier[aClass];
			var classification = classifier.classify(sample, explain);
			if (classification.explanation) {
				var explanations_string = classification.explanation.reduce(function(a,b) {
					return a + " " + sprintf("%s%+1.2f",b.feature,b.relevance);
				}, "");
				if (classification.classification > 0.5) {
					classes[aClass] = true;
					if (explain>0) positive_explanations[aClass]=explanations_string;
				} else {
					if (explain>0) negative_explanations[aClass]=explanations_string;
				}
			} else {
				if (classification > 0.5)
					classes[aClass] = true;
			}
		}
		classes = Object.keys(classes);
		return (explain>0?
			{
				classes: classes, 
				explanation: {
					positive: positive_explanations, 
					negative: negative_explanations,
				}
			}:
			classes);
	},

	toJSON : function(callback) {
		var result = {};
		for ( var aClass in this.mapClassnameToClassifier) {
			var binaryClassifier = this.mapClassnameToClassifier[aClass];
			if (!binaryClassifier.toJSON) {
				console.dir(binaryClassifier);
				console.log("prototype: ");
				console.dir(binaryClassifier.__proto__);
				throw new Error("this binary classifier does not have a toJSON function");
			}
			result[aClass] = binaryClassifier.toJSON(callback);
		}
		return result;
	},

	fromJSON : function(json, callback) {
		for ( var aClass in json) {
			this.mapClassnameToClassifier[aClass] = new this.binaryClassifierType();
			this.mapClassnameToClassifier[aClass].fromJSON(json[aClass]);
		}
		return this;
	},
	
	// private function: 
	makeSureClassifierExists: function(aClass) {
		if (!this.mapClassnameToClassifier[aClass]) { // make sure classifier exists
			this.mapClassnameToClassifier[aClass] = new this.binaryClassifierType();
		}
	},


	getAllClasses: function() {
		return Object.keys(this.mapClassnameToClassifier);
	},

}


/*
 * UTILS
 */

/**
 * Make sure "labels" is an array of strings
 */
function normalizeLabels(labels) {
	if (labels instanceof Object) {
		return Object.keys(labels);
	} else if (Array.isArray(labels)) {
		return labels.map(function(label) {
			return (typeof(label)==='string'? label: JSON.stringify(label));
		});
	} else  {
		return [labels];
	}
}

module.exports = Homer;