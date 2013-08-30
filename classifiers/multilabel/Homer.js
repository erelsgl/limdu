var hash = require("../../utils/hash");
var sprintf = require("sprintf").sprintf;
var _ = require("underscore")._;
var util = require('util');


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
	
	this.splitLabel = opts.splitLabel || function(label)      {return label.split(/@/);}
	this.joinLabel  = opts.joinLabel  || function(superlabel) {return superlabel.join("@");}
	
	this.root = {
		superlabelClassifier: new this.multilabelClassifierType(),
		mapSuperlabelToBranch: {}
	}
	
	this.allClasses = {};
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
		var normalizedLabels = normalizeLabels(labels); // make sure it is an array of strings
		
		for (var i in normalizedLabels)
			this.allClasses[normalizedLabels[i]]=true;
		
		return this.trainOnlineRecursive(
				sample, 
				normalizedLabels.map(this.splitLabel), 
				this.root);
	},

	
	/**
	 *  Recursive internal subroutine of trainOnline.
	 *  @param splitLabels an array of arrays: each internal array represents the parts of a single label.
	 */
	trainOnlineRecursive: function(sample, splitLabels, treeNode) {
		var superlabels = {}; // the first parts of each of the splitLabels
		var mapSuperlabelToRest = {};   // each value is a list of continuations of the key. 
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
		dataset = dataset.map(function(datum) {
			var normalizedLabels = normalizeLabels(datum.output);
			for (var i in normalizedLabels)
				this.allClasses[normalizedLabels[i]]=true;
			return {
				input: datum.input,
				output: normalizedLabels.map(this.splitLabel)
			}
		}, this);
		return this.trainBatchRecursive(dataset, this.root);
	},
	
	/**
	 *  Recursive internal subroutine of trainBatch.
	 */
	trainBatchRecursive: function(dataset, treeNode) {
		var superlabelsDataset = [];
		var mapSuperlabelToRestDataset = {};
		dataset.forEach(function(datum) {
			var splitLabels = datum.output;
			var superlabels = {};           // the first parts of each of the splitLabels
			var mapSuperlabelToRest = {};   // each value is a list of continuations of the key. 
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
			superlabelsDataset.push({
				input: datum.input,
				output: superlabels
			});
			for (var superlabel in mapSuperlabelToRest) {
				if (!(superlabel in mapSuperlabelToRestDataset)) 
					mapSuperlabelToRestDataset[superlabel] = [];
				mapSuperlabelToRestDataset[superlabel].push({
					input: datum.input,
					output: mapSuperlabelToRest[superlabel]
				});
			}
		}, this);

		treeNode.superlabelClassifier.trainBatch(superlabelsDataset);
		for (var superlabel in mapSuperlabelToRestDataset) {
			if (!(superlabel in treeNode.mapSuperlabelToBranch)) {
				treeNode.mapSuperlabelToBranch[superlabel] = {
					superlabelClassifier: new this.multilabelClassifierType(),
					mapSuperlabelToBranch: {}
				}
			}
			this.trainBatchRecursive(mapSuperlabelToRestDataset[superlabel], treeNode.mapSuperlabelToBranch[superlabel]);
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
		//console.log("splitLabels:"+JSON.stringify(splitLabels));
		if (explain>0) {
			splitLabels.classes = splitLabels.classes.map(this.joinLabel);
		} else {
			splitLabels = splitLabels.map(this.joinLabel);
		}
		return splitLabels;
	},
	
	
	/**
	 *  Recursive internal subroutine of classify.
	 *  @return an array of arrays, where each internal array represents a split label.
	 */
	classifyRecursive: function(sample, explain, treeNode, depth) {
		//console.log("start classifyRecursive "+Object.keys(sample)+", explain="+explain+", depth="+depth);
		if (!depth) depth = 1;
		var superlabelsWithExplain = treeNode.superlabelClassifier.classify(sample, explain);
		//console.log("   sample="+Object.keys(sample));
		var superlabels = (explain>0? superlabelsWithExplain.classes: superlabelsWithExplain);
		var splitLabels = [];
		if (explain>0) {
			var explanations = ["depth="+depth, superlabelsWithExplain.explanation];
		}
		for (var i in superlabels) {
			var superlabel = superlabels[i];
			var splitLabel = [superlabel];
			var branch = treeNode.mapSuperlabelToBranch[superlabel];
			if (branch) {
				var branchLabelsWithExplain = this.classifyRecursive(sample, explain, branch, depth+1);
				var branchLabels = (explain>0? branchLabelsWithExplain.classes: branchLabelsWithExplain);
				for (var j in branchLabels)
					splitLabels.push(splitLabel.concat(branchLabels[j]));
				if (explain>0) 
					explanations = explanations.concat(branchLabelsWithExplain.explanation);
			} else {
				splitLabels.push(splitLabel);
			}
		}
		//console.log("end   classifyRecursive "+Object.keys(sample)+", explain="+explain+", depth="+depth+" = "+JSON.stringify(splitLabels));
		return (explain>0? 
				{classes: splitLabels, explanation: explanations}:
				splitLabels);
	},


	toJSON: function() {
		//console.log("In toJSON: " +util.inspect(this.root, {depth:1}));
		return this.toJSONRecursive(this.root);
	},
	
	toJSONRecursive: function(treeNode) {
		//console.log("start toJSONRecursive: " +util.inspect(treeNode, {depth:1}));
		var treeNodeJson = { 
			superlabelClassifier: treeNode.superlabelClassifier.toJSON(),
			mapSuperlabelToBranch: {}
		};
		for (var superlabel in treeNode.mapSuperlabelToBranch) {
			treeNodeJson.mapSuperlabelToBranch[superlabel] = this.toJSONRecursive(treeNode.mapSuperlabelToBranch[superlabel]);
		}
		//console.log("end   toJSONRecursive: " +util.inspect(treeNodeJson, {depth:1}));
		return treeNodeJson;
	},

	fromJSON: function(json) {
		//console.log("In fromJSON: " +util.inspect(json, {depth:1}));
		this.root = this.fromJSONRecursive(json);
		//console.log(util.inspect(this.root, {depth:4}));
		return this;
	},
	
	fromJSONRecursive: function(treeNodeJson) {
		var treeNode = {
			mapSuperlabelToBranch: {}
		}; 
		treeNode.superlabelClassifier =  new this.multilabelClassifierType();
		treeNode.superlabelClassifier.fromJSON(treeNodeJson.superlabelClassifier);
		for (var superlabel in treeNodeJson.mapSuperlabelToBranch) {
			treeNode.mapSuperlabelToBranch[superlabel] = this.fromJSONRecursive(treeNodeJson.mapSuperlabelToBranch[superlabel]);
		}
		return treeNode;
	},

	getAllClasses: function() {
		return Object.keys(this.allClasses);
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