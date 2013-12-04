var hash = require("../../utils/hash");
var sprintf = require("sprintf").sprintf;
var multilabelutils = require('./multilabelutils');
var _ = require("underscore")._;
var PrecisionRecall = require('../../utils/PrecisionRecall');
var partitions = require('../../utils/partitions');

/* ThresholdClassifier - classifier that converts multi-class classifier to multi-label classifier by finding
 * the best appropriate threshold. 
 * @param opts
 *            devsetsize (0.1) - size of the development set from the training set, needed to identify the appropriate threshold, by default 0.1
 *            evaluateMeasureToMaximize (mandatory) - function that helps evaluate the performance of a given threshold, usually F1 measure.
 *			  multiclassClassifier - multi-class classifier used for classification.
 * @author Vasily Konovalov
 */

var ThresholdClassifier = function(opts) {
	
	opts = opts || {};

	if (!('multiclassClassifierType' in opts)) {
		console.dir(opts);
		throw new Error("opts must contain multiclassClassifierType");
	}
	if (!opts.multiclassClassifierType) {
		console.dir(opts);
		throw new Error("opts.multiclassClassifierType is null");
	}

	if (!('evaluateMeasureToMaximize' in opts)) {
		console.dir(opts);
		throw new Error("opts must contain evaluateMeasureToMaximize");
	}
	if (!opts.evaluateMeasureToMaximize) {
		console.dir(opts);
		throw new Error("opts.evaluateMeasureToMaximize is null");
	}
	
	this.multiclassClassifier = new opts.multiclassClassifierType();
	this.devsetsize = typeof opts.devsetsize !== 'undefined' ? opts.devsetsize : 0.1;
	this.evaluateMeasureToMaximize = opts.evaluateMeasureToMaximize;
}

ThresholdClassifier.prototype = {

	trainOnline: function(sample, labels) {
		throw new Error("ThresholdClassifier does not support online training");
	},

	/**
	 * Train the classifier with all the given documents and identify the best possible threshold
	 * simply by running over all relevant scores and determining the value of feedback function
	 * (F1 by default)
	 * 
	 * @param dataset
	 *            an array with objects of the format: 
	 *            {input: sample1, output: [class11, class12...]}
	 * @author Vasily Konovalov
	 * 
	 */
	trainBatch : function(dataset) {

		// for test only, train and valid and test the threshold on the same set, otherwise
		// best threshold for small validset could not be the best one for testset = trainset
		if (this.devsetsize == 1)
			{
				validset = dataset
			}
			else
			{
				clonedataset = partitions.partition(dataset, 1, Math.round(dataset.length*this.devsetsize))
				dataset = clonedataset['train']
				validset = clonedataset['test']
			}
		
		this.multiclassClassifier.trainBatch(dataset);

		var scoresVector = [];

		list_of_scores = [];

		for (var i=0; i<validset.length; ++i) 
		{
 			var scoresVector = this.multiclassClassifier.classify(validset[i].input, false, true);
 			validset[i].score = scoresVector
 			validset[i].output =  multilabelutils.normalizeClasses(validset[i].output);
 			list_of_scores = list_of_scores.concat(multilabelutils.getvalue(scoresVector))
 		}	

		// sortBy implements NUMERIC sort, by default .sort() ALPHABETIC sort
		list_of_scores = _.sortBy(list_of_scores, function(num){ return num; });
		list_of_scores = _.uniq(list_of_scores, true)
		
 		// the value to determine the threshold
		var evaluateMeasureToMaximize_bestvalue = Number.MIN_VALUE
		var threshold_value = Number.MIN_VALUE

 		for (var th=0; th<list_of_scores.length; ++th) {
 			var currentStats = new PrecisionRecall();
 			var explanations = []
	 		for (var i=0; i<validset.length; ++i) {
				scoresVector = validset[i].score
				var actualClasses = multilabelutils.mapScoresVectorToMultilabelResult(scoresVector, false, false, list_of_scores[th]);
				currentStats.addCasesHash(validset[i].output, actualClasses, true);
				//console.log(currentStats.addCasesHash(validset[i].output, actualClasses, true))
			}

			var evaluateMeasureToMaximize_value = this.evaluateMeasureToMaximize(currentStats, 0)
			if (evaluateMeasureToMaximize_value>evaluateMeasureToMaximize_bestvalue)
			{
				evaluateMeasureToMaximize_bestvalue = evaluateMeasureToMaximize_value
				threshold_value = list_of_scores[th]
			}
		}
		this.multiclassClassifier.threshold = threshold_value
	},

	classify: function(sample, explain) {
		return this.multiclassClassifier.classify(sample, explain, /*withScores=*/false);
	},
	
	getAllClasses: function() {
		return this.multiclassClassifier.getAllClasses();
	},

	toJSON : function() {
		return this.multiclassClassifier.toJSON();
	},

	fromJSON : function(json) {
		this.multiclassClassifier.fromJSON(json);
	},
	
	setFeatureLookupTable: function(featureLookupTable) {
		if (this.multiclassClassifier.setFeatureLookupTable)
			this.multiclassClassifier.setFeatureLookupTable(featureLookupTable);
	},
}


module.exports = ThresholdClassifier;
