/**
 * a unit-test for Multi-Label classification in the Binary-Relevance method,
 * with Naive Bayes as the underlying binary classifier.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

var should = require('should');
var classifiers = require('../../../classifiers');

var BinaryRelevanceBayes = classifiers.multilabel.BinaryRelevance.bind(this, {
		binaryClassifierType: classifiers.Bayesian.bind(this, {
		}),
});

// Note: currently this classifier does not classify correctly, so the test is disabled

/*
describe('Multi-Label BR Classifier Trained on Single-class inputs', function() {
	var classifier = new BinaryRelevanceBayes();
	classifier.trainBatch([
		{input: {I:1 , want:1 , aa:1 }, output: 'A'},      // train on single class
		{input: {I:1 , want:1 , bb:1 }, output: ['B']},    // train on array with single class (same effect)
		{input: {I:1 , want:1 , cc:1 }, output: [{C:"c"}]},// train on structured class, that will be stringified to "{C:c}".
	]);
	//console.dir(classifier);
	console.dir(classifier.classify({I:1 , want:1 , aa:1 , and:1 , bb:1 }, 4));
	
	it ('knows its classes', function() {
		classifier.getAllClasses().should.eql([ 'A', 'B', '{"C":"c"}' ]);
	})

	it('classifies 1-class samples', function() {
		classifier.classify({I:1 , want:1 , aa:1 }).should.eql(['A']);
		classifier.classify({I:1 , want:1 , bb:1 }).should.eql(['B']);
		classifier.classify({I:1 , want:1 , cc:1 }).should.eql(['{"C":"c"}']);
	});

	it('classifies 2-class samples', function() {
		classifier.classify({I:1 , want:1 , aa:1 , and:1 , bb:1 }).should.eql(['A','B']);
		classifier.classify({I:1 , want:1 , bb:1 , and:1 , cc:1 }).should.eql(['B','{"C":"c"}']);
		classifier.classify({I:1 , want:1 , cc:1 , and:1 , aa:1 }).should.eql(['A','{"C":"c"}']);
	});

	it('classifies 3-class samples', function() {
		classifier.classify({I:1 , want:1 , aa:1 , and:1 , bb:1 , "'": true, cc:1 }).should.eql(['A','B','{"C":"c"}']);
	});

	it('classifies 0-class samples', function() {
		classifier.classify({I:1 , want:1 , nothing:1 }).should.eql([]);
	});
})

describe('Multi-Label BR Classifier Trained on two-class inputs', function() {
	var classifier = new BinaryRelevanceBayes();
	classifier.trainBatch([
		{input: {I:1 , want:1 , aa:1 , bb:1 }, output: ['A','B']},      // train on array with classes
		{input: {I:1 , want:1 , bb:1 , cc:1 }, output: ['B','C']},      // train on array with classes
		{input: {I:1 , want:1 , cc:1 , dd:1 }, output: [{C:1, D:1}]},   // train on set of classes
		{input: {I:1 , want:1 , dd:1 , aa:1 }, output: [{D:1, A:1}]},   // train on set of classes
	]);

	it('classifies 1-class samples', function() {
		classifier.classify({I:1 , want:1 , aa:1 }).should.eql(['A']);
		//classifier.classify({I:1 , want:1 , bb:1 }).should.eql(['B']);
		//classifier.classify({I:1 , want:1 , cc:1 }).should.eql(['C']);
		//classifier.classify({I:1 , want:1 , dd:1 }).should.eql(['D']);
	});

	it('classifies 2-class samples', function() {
		classifier.classify({I:1 , want:1 , aa:1 , and:1 , bb:1 }).should.eql(['A','B']);
		classifier.classify({I:1 , want:1 , bb:1 , and:1 , cc:1 }).should.eql(['B','C']);
		//classifier.classify({I:1 , want:1 , cc:1 , and:1 , dd:1 }).should.eql(['C','D']);
		//classifier.classify({I:1 , want:1 , dd:1 , and:1 , aa:1 }).should.eql(['D','A']);
	});
});

*/