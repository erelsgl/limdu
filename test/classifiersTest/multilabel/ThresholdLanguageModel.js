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
var ToTest = require('../../../utils/trainAndTest').test;
var multilabelutils = require('../../../classifiers/multilabel/multilabelutils');

var classifier = classifiers.multilabel.CrossLanguageModel.bind(this, {
 	smoothingFactor : 0.9,
});

var ThresholdCrossLanguageModel = classifiers.multilabel.ThresholdClassifier.bind(this, {
		multiclassClassifierType: classifier,
        evaluateMeasureToMaximize: 'F1',
        numOfFoldsForThresholdCalculation: 1,
});

train = []
test = []

_.times(50, function(e) { train.push({'input':wordcounts(random.random_string(5)), 'output':random.random_list_length([1,2,3,4,5])}) })
_.times(10, function(e) { test.push({'input':wordcounts(random.random_string(5)), 'output':random.random_list_length([1,2,3,4,5])}) })

describe('Threshold function', function() {

	it('calculates stats correctly according to PrecisionRecall module', function() {

		var classifierBatch = new ThresholdCrossLanguageModel();

		classifierBatch.multiclassClassifier.trainBatch(train);
		scores = classifierBatch.receiveScores(test)
		
		result = classifierBatch.CalculatePerformance(scores[0], test, scores[1])

		threshold = result['Threshold']

		classifierBatch.multiclassClassifier.threshold = threshold

		stats = ToTest(classifierBatch.multiclassClassifier, test, 0)
		
		result['TP'].should.be.equal(stats['TP'])
		result['FP'].should.be.equal(stats['FP'])
		result['FN'].should.be.equal(stats['FN'])
		result['Accuracy'].should.be.equal(stats['Accuracy'])
	})

	it('finds the best measure element [F1, Accuracy]', function() {
		var classifierBatch = new ThresholdCrossLanguageModel();

		classifierBatch.multiclassClassifier.trainBatch(train);
		scores = classifierBatch.receiveScores(test)

		result = classifierBatch.CalculatePerformance(scores[0], test, scores[1])
	
		_.each(scores[0], function(value, key, list){ 
			currentThreshold = value[1]
			classifierBatch.multiclassClassifier.threshold = currentThreshold
			stats = ToTest(classifierBatch.multiclassClassifier, test, 0)
			stats['F1'].should.not.above(result['F1'])
		})

	})
})
