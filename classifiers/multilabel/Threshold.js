var hash = require("../../utils/hash");
var sprintf = require("sprintf").sprintf;
var multilabelutils = require('./multilabelutils');
var _ = require("underscore")._;
var PrecisionRecall = require('../../utils/PrecisionRecall');
var partitions = require('../../utils/partitions');

var Threshold = function(opts) {
	
	opts = opts || {};
	if (!('multiclassClassifierType' in opts)) {
		console.dir(opts);
		throw new Error("opts must contain multiclassClassifierType");
	}
	if (!opts.multiclassClassifierType) {
		console.dir(opts);
		throw new Error("opts.multiclassClassifierType is null");
	}
	
	this.multiclassClassifier = new opts.multiclassClassifierType();
	this.devsetsize = typeof opts.devsetsize !== 'undefined' ? opts.devsetsize : 0.1;
	this.evaluatefeedback = opts.evaluatefeedback;
}

Threshold.prototype = {

	trainOnline: function(sample, labels) {
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

		clonedataset = partitions.partition(dataset, 1, Math.round(dataset.length*this.devsetsize))
		dataset = clonedataset['train']
		validset = clonedataset['test']
		
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

		list_of_scores = _.sortBy(list_of_scores, function(num){ return num; });
		list_of_scores = _.uniq(list_of_scores, true)
		
 		// the value to determite the threshold
		var feedback_value = Number.MIN_VALUE
		var threshold_value = Number.MIN_VALUE

 		for (var th=0; th<list_of_scores.length; ++th) {

 			var currentStats = new PrecisionRecall();
 			var explanations = []

	 		for (var i=0; i<validset.length; ++i) {
				
				scoresVector = validset[i].score
				var actualClasses = multilabelutils.mapScoresVectorToMultilabelResult(scoresVector, false, false, list_of_scores[th]);
				explanations.push(currentStats.addCasesHash(validset[i].output, actualClasses, true));
			}

			var current_feedback = this.evaluatefeedback(explanations, 0)

			if (current_feedback>feedback_value)
			{
				current_feedback = feedback_value
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
	},

	fromJSON : function(json) {
	},
	
	setFeatureLookupTable: function(featureLookupTable) {

	},
}


module.exports = Threshold;
