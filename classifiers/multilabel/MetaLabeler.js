var hash = require("../../utils/hash");
var sprintf = require("sprintf").sprintf;
var _ = require("underscore")._;

/**
 * MetaLabeler - Multi-label classifier, based on:
 * 
 * Tang Lei, Rajan Suju, Narayanan Vijay K.. Large scale multi-label classification via metalabeler in Proceedings of the 18th international conference on World wide webWWW '09(New York, NY, USA):211-220ACM 2009.
 * http://www.citeulike.org/user/erelsegal-halevi/article/4860265
 * 
 * A MetaLabeler uses two multi-class classifiers to create a single multi-label classifier. One is called "ranker" and the other is called "counter".
 * 
 * The MetaLabeler assigns labels to a sample in the following two stages:
 *  - Stage 1: Ranking. The sample is sent to the "ranker", which returns all available labels ordered from the most relevant to the least relevant.
 *  - Stage 2: Counting. The sample is sent to the "counter", which returns integer C >= 0 which represents a number of labels.
 * The MetaLabeler returns the C most relevant labels from the list returned by the ranker.   
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
	 * @param labels an array whose VALUES are classes.
	 */
	trainOnline: function(sample, labels) {
		// The ranker is just trained by the given set of relevant labels:
		this.ranker.trainOnline(sample, labels);

		// The counter is trained by the *number* of relevant labels:
		var labelCount = (Array.isArray(labels)? labels: Object.keys(labels)).length;
		this.counter.trainOnline(sample, labelCount);
	},

	/**
	 * Train the classifier with all the given documents.
	 * 
	 * @param dataset
	 *            an array with objects of the format: 
	 *            {input: sample1, output: [class11, class12...]}
	 */
	trainBatch : function(dataset) {
		// The ranker is just trained by the given set of labels relevant to each sample:
		this.ranker.trainBatch(dataset);

		// The counter is trained by the *number* of labels relevant to each sample:
		var labelCountDataset = dataset.map(function(datum) {
			var labelCount = (Array.isArray(datum.output)? datum.output.length: 1);
			return {
				input: datum.input,
				output: labelCount
			};
		});
		this.counter.trainBatch(labelCountDataset);
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
		var labelCount = (explain>0? labelCountWithExplain.classes[0][0]: labelCountWithExplain[0][0]);
		if (_.isString(labelCount)) labelCount = parseInt(labelCount);
		
		// Pick the labelCount most relevant labels from the list returned by the ranker:   
		var positiveLabelsWithScores = rankedLabels.slice(0, labelCount);

		var positiveLabels = positiveLabelsWithScores

		if (positiveLabelsWithScores.length != 0)
			if (_.isArray(positiveLabelsWithScores[0]))
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
