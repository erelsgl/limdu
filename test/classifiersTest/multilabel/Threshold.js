/**
 * a unit-test for Threshold Classifier with Passiive Aggresive.
 * 
 * @author Vasily Konovalov
 */

var _ = require('underscore');
var should = require('should');
var classifiers = require('../../../classifiers');
var random = require('../../generaterandom');
var wordcounts = require('../../wordcounts');
var partitions = require('../../../utils/partitions');
var fs = require('fs');


var classifier = classifiers.multilabel.CrossLanguageModel.bind(this, {
	smoothingFactor : 0.9,
	// labelFeatureExtractor: Hierarchy.splitJsonFeatures,
});

// var classifier = classifiers.multilabel.PassiveAggressive.bind(this, {
// 	Constant: 5.0,
// 	retrain_count: 10,
// });

var ThresholdPassiveAggressive = classifiers.multilabel.ThresholdClassifier.bind(this, {
		multiclassClassifierType: classifier,
        devsetsize: 1,  // validationset equal to trainset
        evaluateMeasureToMaximize: 1,
});


describe('Threshold inner function', function() {

	it('It should correctly calculate Variance', function() {

		var classifier = new ThresholdPassiveAggressive();
		list = [170,300,430,470,600]	
		variance = classifier.variance(list)
		variance.should.be.equal(21704)
		
		}),
	it('it should compare correctly two lists', function() {
		var classifier = new ThresholdPassiveAggressive();
		list1= [1,2,3,4,5,6,7]
		list2= [5,7,6,2,3,1,4]
		classifier.is_equal_set(list1,list2).should.be.true

		list1= [1,2,3,4,5]
		list2= [5,2,3,5,1]
		classifier.is_equal_set(list1,list2).should.be.false
	})

	it('it should calculate average correctly', function() {
		var classifier = new ThresholdPassiveAggressive();
		list1= [1,2,3,4,5,6,7]
		classifier.average(list1).should.be.equal(4)
	})

	it('it should calculate median correctly', function() {
		var classifier = new ThresholdPassiveAggressive();
		var list1 = [3, 8, 9, 1, 5, 7, 9, 21];
		classifier.median(list1).should.be.equal(7.5)
	})

	it('it should calculate median correctly', function() {
		train = []
		test = []

		var classifierBatch = new ThresholdPassiveAggressive();


		 _.times(50, function(e) { train.push({'input':wordcounts(random.random_string(5)), 'output':[_.random(0, 3)]}) })
		 _.times(10, function(e) { test.push({'input':wordcounts(random.random_string(5)), 'output':[_.random(0, 3)]}) })


		classifierBatch.multiclassClassifier.trainBatch(train);
		scores = classifierBatch.receiveScores(test)

		result = classifierBatch.CalculatePerformance(scores[0], test, scores[1])
		console.log(result)

		threshold = result['Threshold']
		
		// classifierBatch.multiclassClassifier.trainBatch(train);
		performance = classifierBatch.EvaluateThreshold(test, threshold)
		console.log(performance)
	})
})
