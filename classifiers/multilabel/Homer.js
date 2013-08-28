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
	
	this.splitLabel = opts.splitLabel || function(label)      {return label.split(/#/);}
	this.joinLabel  = opts.joinLabel  || function(superlabel) {return superlabel.join("#");}
	
	this.root = {
		superlabelClassifier: new this.multilabelClassifierType(),
		mapSuperlabelToBranch: {}
	}
}

Homer.prototype = {

	/**
	 * Tell the classifier that the given sample belongs to the given classes.
	 * 
	 * @param sample
	 *            a document.
	 * @param classes
	 *            an object whose KEYS are classes, or an array whose VALUES are classes.
	 */
	trainOnline: function(sample, labels) {
		//console.dir(labels);
		var normalizedLabels = normalizeLabels(labels); // convert to array of strings
		//console.dir(normalizedLabels);
		var splitLabels = normalizedLabels.map(this.splitLabel);
		//console.dir(splitLabels);
		return this.trainOnlineRecursive(sample, splitLabels, this.root, /*depth=*/1);
	},

	
	/**
	 *  Recursive internal subroutine of trainOnline.
	 *  @param splitLabels an array of arrays: each internal array represents the parts of a single label.
	 */
	trainOnlineRecursive: function(sample, splitLabels, treeNode) {
		var superlabels = {};
		var mapSuperlabelToRest = {};
		for (var i in splitLabels) {
			var splitLabel = splitLabels[i];
			var superlabel = splitLabel[0];
			superlabels[superlabel] = true;
			if (splitLabel.length>1) {
				if (!mapSuperlabelToRest[superlabel]) 
					mapSuperlabelToRest[superlabel] = [];
				mapSuperlabelToRest[superlabel].push(splitLabel.slice(1));
			}
		}

		//console.log("train the superlabel classifier: sample="+JSON.stringify(sample)+", superlabels="+JSON.stringify(superlabels));
		treeNode.superlabelClassifier.trainOnline(sample, superlabels);
		for (var superlabel in mapSuperlabelToRest) {
			if (!(superlabel in treeNode.mapSuperlabelToBranch)) {
				treeNode.mapSuperlabelToBranch[superlabel] = {
					superlabelClassifier: new this.multilabelClassifierType(),
					mapSuperlabelToBranch: {}
				}
			}
			this.trainOnlineRecursive(sample, mapSuperlabelToRest[superlabel], treeNode.mapSuperlabelToBranch[superlabel]);
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
	 *  Recursive internal subroutine of trainBatch.
	 */
	trainBatchRecursive: function(dataset, treeNode) {
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
	 * Use the model trained so far to classify a new sample.
	 * 
	 * @param sample a document.
	 * @param explain - int - if positive, an "explanation" field, with the given length, will be added to the result.
	 *  
	 * @return an array whose VALUES are classes.
	 */
	classify: function(sample, explain) {
		var splitLabels = this.classifyRecursive(sample, explain, this.root);
		//console.dir(splitLabels);
		return splitLabels.map(this.joinLabel);
	},
	
	
	/**
	 *  Recursive internal subroutine of classify.
	 *  @return an array of arrays, where each internal array represents a split label.
	 */
	classifyRecursive: function(sample, explain, treeNode) {
		var superlabelsWithExplain = treeNode.superlabelClassifier.classify(sample, explain);
		var superlabels = (explain>0? superlabelsWithExplain.classes: superlabelsWithExplain);
		var splitLabels = [];
		for (var i in superlabels) {
			var superlabel = superlabels[i];
			var splitLabel = [superlabel];
			var branch = treeNode.mapSuperlabelToBranch[superlabel];
			if (branch) {
				splitLabel = splitLabel.concat(
						this.classifyRecursive(sample, explain, branch));
			}
			splitLabels.push(splitLabel);
		}
		return splitLabels;
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
function normalizeLabels(theLabels) {
	if (Array.isArray(theLabels)) {
		return theLabels.map(function(label) {
			return (typeof(label)==='string'? label: JSON.stringify(label));
		});
	} else if (theLabels instanceof Object) {
			return Object.keys(theLabels);
	} else  {
		return [theLabels];
	}
}

module.exports = Homer;