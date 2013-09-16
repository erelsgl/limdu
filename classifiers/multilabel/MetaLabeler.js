var hash = require("../../utils/hash");
var sprintf = require("sprintf").sprintf;
var _ = require("underscore")._;

/**
 * MetaLabeler - Multi-label classifier, based on:
 * 
 * Tang Lei, Rajan Suju, Narayanan Vijay K.. Large scale multi-label classification via metalabeler in Proceedings of the 18th international conference on World wide webWWW '09(New York, NY, USA):211-220ACM 2009.
 * http://www.citeulike.org/user/erelsegal-halevi/article/4860265
 * 
 * @param opts
 *            rankerType (mandatory) - the type of the multi-class classifier used for ranking the labels. 
 *            counterType (mandatory) - the type of the multi-class classifier used for selecting the number of labels. 
 */
var MetaLabeler = function(opts) {
	if (!opts.rankerType) {
		console.dir(opts);
		throw new Error("opts.rankerType not found");
	}
	if (!opts.counterType) {
		console.dir(opts);
		throw new Error("opts.counterType not found");
	}
	this.ranker = new opts.rankerType();
	this.counter = new opts.counterType();
}

MetaLabeler.prototype = {

	/**
	 * Tell the classifier that the given sample belongs to the given classes.
	 * 
	 * @param sample  a document.
	 * @param classes an array whose VALUES are classes.
	 */
	trainOnline: function(sample, classes) {
		this.ranker.trainOnline(sample, classes);
		this.counter.trainOnline(sample, (Array.isArray(classes)? classes: Object.keys(classes)).length);
	},

	/**
	 * Train the classifier with all the given documents.
	 * 
	 * @param dataset
	 *            an array with objects of the format: 
	 *            {input: sample1, output: [class11, class12...]}
	 */
	trainBatch : function(dataset) {
		this.ranker.trainBatch(dataset);
		//console.dir(dataset);
		var countDataset = dataset.map(function(datum) {
			return {
				input: datum.input,
				output: (Array.isArray(datum.output)? datum.output.length: 1)
			};
		});
		//console.dir(countDataset);
		this.counter.trainBatch(countDataset);
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
		var rankedLabelsWithExplain = this.ranker.classify(sample, explain, /*withScores=*/true);
		var rankedLabels = (explain>0? rankedLabelsWithExplain.classes: rankedLabelsWithExplain);
		var labelCountWithExplain = this.counter.classify(sample, explain, /*withScores=*/true);
		//console.dir(labelCountWithExplain);
		var labelCount = (explain>0? labelCountWithExplain.classes[0][0]: labelCountWithExplain[0][0]);
		if (_.isString(labelCount)) labelCount = parseInt(labelCount);
		//console.log("labelCount="+labelCount);
		var positiveLabelsWithScores = rankedLabels.slice(0, labelCount);
		var positiveLabels = positiveLabelsWithScores.map(function(labelWithScore) {return labelWithScore[0]});
		return (explain>0? {
			classes: positiveLabels,
			explanation: {
				ranking: rankedLabelsWithExplain.explanation,
				counting: labelCountWithExplain.explanation
			}
		}:
		positiveLabels)
	},
	
	getAllClasses: function() {
		return this.ranker.getAllClasses();
	},

	toJSON : function() {
	},

	fromJSON : function(json) {
	},
	
	/**
	 * Link to a FeatureLookupTable from a higher level in the hierarchy (typically from an EnhancedClassifier), used ONLY for generating meaningful explanations. 
	 */
	setFeatureLookupTable: function(featureLookupTable) {
		if (this.ranker.setFeatureLookupTable)
			this.ranker.setFeatureLookupTable(featureLookupTable);
		if (this.counter.setFeatureLookupTable)
			this.counter.setFeatureLookupTable(featureLookupTable);
	},
}


module.exports = MetaLabeler;
