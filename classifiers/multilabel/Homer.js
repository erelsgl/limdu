var hash = require("../../utils/hash");
var sprintf = require("sprintf").sprintf;
var _ = require("underscore")._;
var util = require('util');
var multilabelutils = require('./multilabelutils');


/**
 * HOMER - Hierarchy Of Multilabel classifiERs. See:
 * 
 * Tsoumakas Grigorios, Katakis Ioannis, Vlahavas Ioannis. Effective and Efficient Multilabel Classification in Domains with Large Number of Labels in Proc. ECML/PKDD 2008 Workshop on Mining Multidimensional Data (MMD'08):XX 2008.
 * http://www.citeulike.org/user/erelsegal-halevi/tag/homer
 * 
 * @param opts
 *            multilabelClassifierType (mandatory) - the type of the multilabel classifier used in each level of the hierarchy.
 *            splitLabel (optional) - a function that splits a label to a array of sub-labels, from root to leaves. DEFAULT: split around the "@" char. 
 *            joinLabel (optional) - a function that joins an array of sub-labels, from root to leaves, to create a full label. DEFAULT: join with the "@" char.
 *  
 * @note The original HOMER paper used a clustering algorithm to create a hierarchy of labels.
 * This clustering algorithm is not implemented here.
 * Instead, we use a custom function that converts a label to a path in the hierarchy, and another custom function that converts a path back to a label.
 */
var Homer = function(opts) {
	opts = opts || {};
	if (!opts.multilabelClassifierType) {
		console.dir(opts);
		throw new Error("opts.multilabelClassifierType is null");
	}
	this.multilabelClassifierType = opts.multilabelClassifierType;
	
	this.splitLabel = opts.splitLabel || function(label)      {return label.split(/@/);}
	this.joinLabel  = opts.joinLabel  || function(superlabel) {return superlabel.join("@");}
	
	this.root = {
		superlabelClassifier: this.newMultilabelClassifier(),
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
		labels = multilabelutils.normalizeOutputLabels(labels);
		
		for (var i in labels)
			this.allClasses[labels[i]]=true;
		
		return this.trainOnlineRecursive(
				sample, 
				labels.map(this.splitLabel), 
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

		treeNode.superlabelClassifier.trainOnline(sample, Object.keys(superlabels));
		for (var superlabel in mapSuperlabelToRest) {
			if (!(superlabel in treeNode.mapSuperlabelToBranch)) {
				treeNode.mapSuperlabelToBranch[superlabel] = {
					superlabelClassifier: this.newMultilabelClassifier(),
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
			var normalizedLabels = multilabelutils.normalizeOutputLabels(datum.output);
			for (var i in normalizedLabels)
				this.allClasses[normalizedLabels[i]]=true;
			return {
				input: datum.input,
				output: normalizedLabels.map(this.splitLabel)
			}
		}, this);
		
		// [ [ 'Offer', 'Leased Car', 'Without leased car' ], [ 'Offer', 'Working Hours', '9 hours' ] ]
		
		return this.trainBatchRecursive(dataset, this.root);
	},
	
	/**
	 *  Recursive internal subroutine of trainBatch.
	 */
	trainBatchRecursive: function(dataset, treeNode) {
		var superlabelsDataset = [];
		var mapSuperlabelToRestDataset = {};
		dataset.forEach(function(datum) { 
			var splitLabels = datum.output;	// [ [ 'Offer', 'Leased Car', 'Without leased car' ], [ 'Offer', 'Working Hours', '9 hours' ] ]
			var superlabels = {};           // the first parts of each of the splitLabels
			var mapSuperlabelToRest = {};   // each value is a list of continuations of the key. 
			for (var i in splitLabels) { 
				var splitLabel = splitLabels[i];//[ 'Offer', 'Leased Car', 'Without leased car' ]
				var superlabel = splitLabel[0];
				superlabels[superlabel] = true; //superlabels['Offer'] = true
				if (splitLabel.length>1) { 		// if it have more than one label (superlabel)
					if (!mapSuperlabelToRest[superlabel]) 
						mapSuperlabelToRest[superlabel] = [];
					mapSuperlabelToRest[superlabel].push(splitLabel.slice(1));//['Leased Car', 'Without leased car']
				}
			}

/*			Sample of mapSuperlabelToRest
			{ Offer: 
			[ [ 'Leased Car', 'Without leased car' ],
   			  [ 'Working Hours', '9 hours' ] ] }

			Sample of superlabelsDataset, initial dataset with superlabel instead of entire output
			'. [end]': 0.965080896043587 },
			output: [ 'Offer' ] } ]
*/
			superlabelsDataset.push({
				input: datum.input,
				output: Object.keys(superlabels)
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
		
/*		Sample of mapSuperlabelToRestDataset
		{ Offer: [ { input: [Object], output: [["Leased Car","Without leased car"],["Working Hours","9 hours"]] } ] }
*/

		// train the classifier only on superlabels
		treeNode.superlabelClassifier.trainBatch(superlabelsDataset);

		for (var superlabel in mapSuperlabelToRestDataset) {
			if (!(superlabel in treeNode.mapSuperlabelToBranch)) {
				treeNode.mapSuperlabelToBranch[superlabel] = {
					superlabelClassifier: this.newMultilabelClassifier(),
					mapSuperlabelToBranch: {}
				}
			}
/*			train the next level classifier for a give superlabel classifier superlabel (from loop)
			with the dataset from new structure mapSuperlabelToRestDataset (see above)
*/			this.trainBatchRecursive(mapSuperlabelToRestDataset[superlabel], treeNode.mapSuperlabelToBranch[superlabel]);
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
		if (!depth) depth = 1;
		// classify the superlabel 
		var superlabelsWithExplain = treeNode.superlabelClassifier.classify(sample, explain);
		var superlabels = (explain>0? superlabelsWithExplain.classes: superlabelsWithExplain);
		
		var splitLabels = [];
		if (explain>0) {
			var explanations = ["depth="+depth+": "+superlabels, superlabelsWithExplain.explanation];
		}

		// for all superlabels that were classified, may be there are more than one that were classified with it
		for (var i in superlabels) {
			var superlabel = superlabels[i];
			var splitLabel = [superlabel];
			
			// classifier of [Offer] types / second level / classifies Offer's parameters
			var branch = treeNode.mapSuperlabelToBranch[superlabel];
			
			if (branch) {
				
				// [ [ 'Without leased car' ] ]
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
		return (explain>0? 
				{classes: splitLabels, explanation: explanations}:
				splitLabels);
	},


	toJSON: function() {
		var json = this.toJSONRecursive(this.root);
		json.allClasses = this.allClasses;
		return json;
	},
	
	toJSONRecursive: function(treeNode) {
		var treeNodeJson = { 
			superlabelClassifier: treeNode.superlabelClassifier.toJSON(),
			mapSuperlabelToBranch: {}
		};
		for (var superlabel in treeNode.mapSuperlabelToBranch) {
			treeNodeJson.mapSuperlabelToBranch[superlabel] = this.toJSONRecursive(treeNode.mapSuperlabelToBranch[superlabel]);
		}
		return treeNodeJson;
	},

	fromJSON: function(json) {
		this.allClasses = json.allClasses;
		this.root = this.fromJSONRecursive(json);
	},
	
	fromJSONRecursive: function(treeNodeJson) {
		var treeNode = {
			mapSuperlabelToBranch: {}
		}; 
		treeNode.superlabelClassifier =  this.newMultilabelClassifier();
		treeNode.superlabelClassifier.fromJSON(treeNodeJson.superlabelClassifier);
		for (var superlabel in treeNodeJson.mapSuperlabelToBranch) 
			treeNode.mapSuperlabelToBranch[superlabel] = 
				this.fromJSONRecursive(treeNodeJson.mapSuperlabelToBranch[superlabel]);
		return treeNode;
	},

	getAllClasses: function() {
		return Object.keys(this.allClasses);
	},
	
	/**
	 * Link to a FeatureLookupTable from a higher level in the hierarchy (typically from an EnhancedClassifier), used ONLY for generating meaningful explanations. 
	 */
	setFeatureLookupTableRecursive: function(featureLookupTable, treeNode) {
		if (treeNode.superlabelClassifier && treeNode.superlabelClassifier.setFeatureLookupTable)
			treeNode.superlabelClassifier.setFeatureLookupTable(featureLookupTable);
		for (var superlabel in treeNode.mapSuperlabelToBranch)
			this.setFeatureLookupTableRecursive(featureLookupTable, treeNode.mapSuperlabelToBranch[superlabel]);
	},
	
	/**
	 * Link to a FeatureLookupTable from a higher level in the hierarchy (typically from an EnhancedClassifier), used ONLY for generating meaningful explanations. 
	 */
	setFeatureLookupTable: function(featureLookupTable) {
		//console.log("HOMER setFeatureLookupTable "+featureLookupTable);
		this.featureLookupTable = featureLookupTable;
		this.setFeatureLookupTableRecursive(featureLookupTable, this.root);
	},
	
	
	newMultilabelClassifier: function() {
		var classifier = new this.multilabelClassifierType();
		if (this.featureLookupTable && classifier.setFeatureLookupTable)
			classifier.setFeatureLookupTable(this.featureLookupTable);
		return classifier;
	}
}


/*
 * UTILS
 */

module.exports = Homer;