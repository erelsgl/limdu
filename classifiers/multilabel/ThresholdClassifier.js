var hash = require("../../utils/hash");
var sprintf = require("sprintf").sprintf;
var multilabelutils = require('./multilabelutils');
var _ = require("underscore")._;
var PrecisionRecall = require('../../utils/PrecisionRecall');
var partitions = require('../../utils/partitions');
var ulist = require('../../utils/list');


/* ThresholdClassifier - classifier that converts multi-class classifier to multi-label classifier by finding
 * the best appropriate threshold. 
 * @param opts
 *            numOfFoldsForThresholdCalculation - =1 the threshold is approximated on validation set of size 10% of training set
 												  >1 n - fold cross - validation is applied to approximate the threshold
 *            evaluateMeasureToMaximize (['Accuracy','F1']) - string of the measure that operate the improvement of threshold
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
	if (!opts.numOfFoldsForThresholdCalculation) {
		console.dir(opts);
		throw new Error("opts.numOfFoldsForThresholdCalculation is null");
	}
	
	this.multiclassClassifier = new opts.multiclassClassifierType();

	// [F1, Accuracy]	
	this.evaluateMeasureToMaximize = opts.evaluateMeasureToMaximize;

	// constant size of validation set
	this.devsetsize = 0.1

	// > 1, n - fold cross - validation, otherwise validation set
	this.numOfFoldsForThresholdCalculation = opts.numOfFoldsForThresholdCalculation
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

		_.times(3, function(n) {dataset = _.shuffle(dataset)})

		if (this.numOfFoldsForThresholdCalculation > 1) {
			thresholds=[]
			best_performances=[]
			average_performances = []
			median_performances = []
			partitions.partitions_consistent(dataset, this.numOfFoldsForThresholdCalculation, (function(trainSet, testSet, index) { 	 
				this.multiclassClassifier.trainBatch(trainSet);
				result = this.receiveScores(testSet)
				performance = this.CalculatePerformance(result[0], testSet, result[1])
				best_performances.push(performance)
			}).bind(this))

			this.stats = best_performances
					
			threshold_average = ulist.average(_.pluck(best_performances, 'Threshold'))
			threshold_median = ulist.median(_.pluck(best_performances, 'Threshold'))

			Threshold = threshold_median
		}
		else
		{
			dataset = partitions.partition(dataset, 1, Math.round(dataset.length*this.devsetsize))
			trainSet = dataset['train']
			testSet = dataset['test']
			this.multiclassClassifier.trainBatch(trainSet);
			result = this.receiveScores(testSet)
			performance = this.CalculatePerformance(result[0], testSet, result[1])
			Threshold = performance['Threshold']	
		}

		this.multiclassClassifier.threshold = Threshold
	},
	/*
	* Classify dataset and return the scored result in sorted list
	*/
	receiveScores: function(dataset) {
		list_of_scores = [];
		FN=0
		for (var i=0; i<dataset.length; ++i) 
		{
 			var scoresVector = this.multiclassClassifier.classify(dataset[i].input, false, true);

 			for (score in scoresVector)
 			{
 				if (dataset[i].output.indexOf(scoresVector[score][0])>-1)
 				{
 					scoresVector[score].push("+")
 					FN+=1
 				}
 				else {scoresVector[score].push("-")}

 				scoresVector[score].push(i)	
			}

 			list_of_scores = list_of_scores.concat(scoresVector)
  		}	

  		// list_of_scores = [['d',4],['b',2],['a',1],['c',3]]

		list_of_scores.sort((function(index){
		    return function(a, b){
	        return (a[index] === b[index] ? 0 : (a[index] < b[index] ? 1 : -1));
		    };
		})(1))

		return [list_of_scores, FN]
	},
	
	/*
	Calculate the bst threshold with the highest evaluateMeasureToMaximize
	@param  list_of_scores list of scores
	@param  testSet test set
	@param FN false negative
	*/
	CalculatePerformance: function(list_of_scores, testSet, FN){

		current_set=[]

		TRUE = 0
		FP = 0
		TP = 0

		result = []
		
		for (var th=0; th<list_of_scores.length; ++th) {

			if (list_of_scores[th][2]=="+") {TP+=1; FN-=1}
			if (list_of_scores[th][2]=="-") {FP+=1;}

			// console.log(list_of_scores[th])
			// console.log("TP "+TP+" FP "+FP+" FN "+FN)

			index_in_testSet = list_of_scores[th][3]

			if (_.isEqual(current_set[index_in_testSet], testSet[index_in_testSet]['output'])) 
			{TRUE-=1}
			
			if (!current_set[index_in_testSet])
			{current_set[index_in_testSet] = [list_of_scores[th][0]]}
			else
			{current_set[index_in_testSet].push(list_of_scores[th][0])}

 			if (_.isEqual(current_set[index_in_testSet], testSet[index_in_testSet]['output'])) 
			{TRUE+=1 }
			
 			PRF = calculate_PRF(TP, FP, FN)
 			PRF['Accuracy'] = TRUE/testSet.length
 			PRF['Threshold'] = list_of_scores[th][1]
 
 			result[list_of_scores[th][1]] = PRF
 			}

			optial_measure=0
			index=Object.keys(result)[0]
			for (i in result)
			{
				if (result[i][this.evaluateMeasureToMaximize] >= optial_measure)
				{
					index = i
					optial_measure = result[i][this.evaluateMeasureToMaximize]
				}
			}

 			return result[index]
 		
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

function calculate_PRF(TP, FP, FN)
	{
	stats = {}
	stats['TP']=TP
	stats['FP']=FP
	stats['FN']=FN
	stats['Precision'] = (TP + FP == 0? 0: TP/(TP+FP))
	stats['Recall'] = (TP + FN == 0? 0: TP/(TP+FN))
	stats['F1'] = (stats['Precision'] + stats['Recall'] == 0? 0: 2*stats['Precision']*stats['Recall']/(stats['Precision'] + stats['Recall']))
	return stats
	}

module.exports = ThresholdClassifier;
