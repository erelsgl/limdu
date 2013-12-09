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
var PrecisionRecall = require('../../../utils/PrecisionRecall');
var multilabelutils = require('../../../classifiers/multilabel/multilabelutils');

var classifier = classifiers.multilabel.CrossLanguageModel.bind(this, {
	smoothingFactor : 0.9,
});

var ThresholdCrossLanguageModel = classifiers.multilabel.ThresholdClassifier.bind(this, {
		multiclassClassifierType: classifier,
        evaluateMeasureToMaximize: 'F1',
        validateThreshold: 10,
});

train = []
test = []

_.times(50, function(e) { train.push({'input':wordcounts(random.random_string(5)), 'output':random.random_list_length([1,2,3,4,5])}) })
_.times(10, function(e) { test.push({'input':wordcounts(random.random_string(5)), 'output':random.random_list_length([1,2,3,4,5])}) })

describe('Threshold inner function', function() {

	it('it should calculate stats correctly according to PrecisionRecall module', function() {

		var classifierBatch = new ThresholdCrossLanguageModel();

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

	it('it should fidn teh best measure element [F1, Accuracy]', function() {
		var classifierBatch = new ThresholdCrossLanguageModel();

		classifierBatch.multiclassClassifier.trainBatch(train);
		scores = classifierBatch.receiveScores(test)

		result = classifierBatch.CalculatePerformance(scores[0], test, scores[1])
		
		_.each(scores[0], function(value, key, list){ 
			currentThreshold = value[1]
			var currentStats = new PrecisionRecall();
			_.each(test, function(value, key, list){ 
				scoresVector = classifierBatch.multiclassClassifier.classify(value['input'], false, true);
				actualClasses = multilabelutils.mapScoresVectorToMultilabelResult(scoresVector, false, false, currentThreshold);
				currentStats.addCases(value['output'], actualClasses, true);
			})
			currentStats.calculateStats()
			currentStats['F1'].should.not.above(result['F1'])
		})

	})


})
