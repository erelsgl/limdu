/**
 * a unit-test for Threshold Classifier with Passive Aggressive.
 * 
 * @author Vasily Konovalov
 */

var _ = require('underscore');
var should = require('should');
var classifiers = require('../../../classifiers');
var random = require('../../generaterandom');
var testutils = require('../../test_utils');
var wordcounts = require('../../wordcounts');

var classifier = classifiers.multilabel.PassiveAggressive.bind(this, {
	Constant: 5.0,
	retrain_count: 10,
});

var ThresholdPassiveAggressive = classifiers.multilabel.ThresholdClassifier.bind(this, {
		multiclassClassifierType: classifier,
        devsetsize: 1,  // validationset equal to trainset
        evaluateMeasureToMaximize: testutils.F1_evaluation,
	numOfFoldsForThresholdCalculation: 1
});

dataset = []
_.times(500, function(e) { dataset.push({'input':wordcounts(random.random_string(5)), 'output':[{'class':Math.round(Math.random())}]}) })

describe.skip('Threshold classifier', function() {

	it('Threshold classifier on train set should find the best threshold for the train set', function() {

		var classifierBatch = new ThresholdPassiveAggressive();
		classifierBatch.trainBatch(dataset);

		currentStats = testutils.test(dataset, classifierBatch)

		evaluateMeasureToMaximize_bestvalue = testutils.F1_evaluation(currentStats, 0)
		threshold_bestvalue = classifierBatch.multiclassClassifier.threshold
			
		_.times(10, function(n) {
			rnd = Math.random()
			rnd = (rnd < 0.5) ? -1*rnd*100 : 1*rnd*100;
			
			classifierBatch.multiclassClassifier.threshold = threshold_bestvalue + rnd
			currentStats = testutils.test(dataset, classifierBatch)	
			evaluateMeasureToMaximize_value = testutils.F1_evaluation(currentStats, 0)
			evaluateMeasureToMaximize_bestvalue.should.not.be.below(evaluateMeasureToMaximize_value)
		})
	})
})
