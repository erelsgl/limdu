/**
 * a unit-test for Multi-Label classification in the PartialClassification method,
 * with Binary-Relevance as the underlying multi-lable classifier,
 * with Modified Balanced Winnow as the underlying binary classifier.
 * 
 * @author Vasily
 * @since 2014
 */

var should = require('should');
var util = require('util');
var classifiers = require('../../../classifiers');

var retrain_count = 10;

var BinaryRelevanceWinnow = classifiers.multilabel.BinaryRelevance.bind(this, {
		binaryClassifierType: classifiers.Winnow.bind(this, {
			promotion: 1.5,
			demotion: 0.5,
			margin: 1,
			retrain_count: retrain_count,
		}),
});

var PartialClassification = classifiers.multilabel.PartialClassification.bind(this, {
	multilabelClassifierType: BinaryRelevanceWinnow,
	numberofclassifiers: 1
});

/*
 * SIMPLE (NON HIERARCHICAL) LABELS
 */

var trainsetSimple = [  // a simple trainset, with no hierarchy, to use as a baseline:
	{input: {I:1 , want:1 , aa:1 }, output: 'A'},      // train on single class
	{input: {I:1 , want:1 , bb:1 }, output: ['B']},    // train on array with single class (same effect)
	{input: {I:1 , want:1 , cc:1 }, output: [{C:"c"}]},// train on structured class, that will be stringified to "{C:c}".
];

var testPartialClassificationNonHierarchical = function(classifier) {

	it('classifies 1-class samples', function() {
		classifier.classify({I:1 , want:1 , aa:1 }).should.eql([['A']]);
		classifier.classify({I:1 , want:1 , bb:1 }).should.eql([['B']]);
		classifier.classify({I:1 , want:1 , cc:1 }).should.eql([['{"C":"c"}']]);
	});

	it('classifies 2-class samples', function() {
		classifier.classify({I:1 , want:1 , aa:1 , and:1 , bb:1 })[0].sort().should.eql(['A','B'].sort());
		classifier.classify({I:1 , want:1 , bb:1 , and:1 , cc:1 })[0].sort().should.eql(['B','{"C":"c"}'].sort());
		classifier.classify({I:1 , want:1 , cc:1 , and:1 , aa:1 })[0].sort().should.eql(['A','{"C":"c"}'].sort());
	});

	it('classifies 3-class samples', function() {
		classifier.classify({I:1 , want:1 , aa:1 , and:1 , bb:1 , "'": true, cc:1 })[0].sort().should.eql(['A','B','{"C":"c"}'].sort());
	});

	it('classifies 0-class samples', function() {
		classifier.classify({I:1 , want:1 , nothing:1 }).should.eql([[]]);
	});
	
}

describe('PartialClassification classifier batch-trained on single-class non-hierarchical inputs', function() {
	var classifierBatch = new PartialClassification();
	classifierBatch.trainBatch(trainsetSimple);
	testPartialClassificationNonHierarchical(classifierBatch);
})