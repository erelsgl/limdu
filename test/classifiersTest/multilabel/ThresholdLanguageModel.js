/**
 * a unit-test for Threshold Classifier with Language Model.
 * 
 * @author Vasily Konovalov
 */

var _ = require('underscore');
var should = require('should');
var classifiers = require('../../../classifiers');
var random = require('../../generaterandom');
var wordcounts = require('../../wordcounts');


var classifier = classifiers.multilabel.CrossLanguageModel.bind(this, {
	smoothingFactor : 0.9,
});

var ThresholdCrossLanguageModel = classifiers.multilabel.ThresholdClassifier.bind(this, {
		multiclassClassifierType: classifier,
        devsetsize: 1,  // validationset equal to trainset
        evaluateMeasureToMaximize: 1,
});


describe('Threshold inner function', function() {


	it('it should calculate stats correctly according to PrecisionRecall module', function() {
		train = []
		test = []

		var classifierBatch = new ThresholdCrossLanguageModel();

		_.times(50, function(e) { train.push({'input':wordcounts(random.random_string(5)), 'output':[_.random(0, 3)]}) })
	 	_.times(10, function(e) { test.push({'input':wordcounts(random.random_string(5)), 'output':[_.random(0, 3)]}) })


		classifierBatch.multiclassClassifier.trainBatch(train);
		scores = classifierBatch.receiveScores(test)

		result = classifierBatch.CalculatePerformance(scores[0], test, scores[1])

		threshold = result['Threshold']
		
		performance = classifierBatch.EvaluateThreshold(test, threshold)
		
		result['TP'].should.be.equal(performance['TP'])
		result['FP'].should.be.equal(performance['FP'])
		result['FN'].should.be.equal(performance['FN'])
		result['Accuracy'].should.be.equal(performance['Accuracy'])
	})
})
