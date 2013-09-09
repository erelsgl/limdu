/**
 * a unit-test for Multi-Label classification
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

var should = require('should');
var classifiers = require('../../../classifiers');
require('../../sorted');

var explain = 0;

var classifier = new classifiers.multilabel.PassiveAggressive({
	Constant: 5.0,
	retrain_count: 10,
});

describe('Multi-Label PA Classifier Trained on Single-class inputs', function() {
	classifier.trainBatch([
		{input: {I:1 , want:1 , aa:1 }, output: ['A']},
		{input: {I:1 , want:1 , bb:1 }, output: ['B']},
		{input: {I:1 , want:1 , cc:1 }, output: ['C']},
		{input: {I:1 , want:1 , dd:1 }, output: ['D']},
		{input: {I:1 , want:1 , ee:1 }, output: ['E']},
	]);

	it('should classify 1-class samples', function() {
		classifier.classify({I:1 , want:1 , aa:1 },explain).should.eql(['A']);
		classifier.classify({I:1 , want:1 , bb:1 },explain).should.eql(['B']);
		classifier.classify({I:1 , want:1 , cc:1 },explain).should.eql(['C']);
	})

	it('should classify 2-class samples', function() {
		classifier.classify({I:1 , want:1 , aa:1 , and:1 , bb:1 },explain).sorted().should.eql(['A','B']);
		classifier.classify({I:1 , want:1 , bb:1 , and:1 , cc:1 },explain).sorted().should.eql(['B','C']);
		classifier.classify({I:1 , want:1 , cc:1 , and:1 , aa:1 },explain).sorted().should.eql(['A','C']);
	})

	it('should classify 3-class samples', function() {
		classifier.classify({I:1 , want:1 , aa:1 , and:1 , bb:1 , "'":1, cc:1 },explain).sorted().should.eql(['A','B','C']);
	})

	//it('should classify 0-class samples', function() {
	//	classifier.classify({I:1 , want:1 , nothing:1 },explain).sorted().should.eql([]);
	//})
})
