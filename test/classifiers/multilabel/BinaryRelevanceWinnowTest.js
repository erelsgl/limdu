/**
 * a unit-test for Multi-Label classification
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

var should = require('should');
var classifiers = require('../../../classifiers');

var explain = 0;

var classifier = new classifiers.multilabel.BinaryRelevance({
	binaryClassifierType: classifiers.Winnow,
	binaryClassifierOptions: {
		promotion: 1.5,
		demotion: 0.5,
		retrain_count: 10,
	},
});

describe('Multi-Label BR Classifier Trained on Single-class inputs', function() {
	classifier.trainBatch([
		{input: {I:1 , want:1 , aa:1 }, output: ['A']},
		{input: {I:1 , want:1 , bb:1 }, output: ['B']},
		{input: {I:1 , want:1 , cc:1 }, output: ['C']},
	]);

	it('should classify 1-class samples', function() {
		classifier.classify({I:1 , want:1 , aa:1 },explain).should.eql(['A']);
		classifier.classify({I:1 , want:1 , bb:1 },explain).should.eql(['B']);
		classifier.classify({I:1 , want:1 , cc:1 },explain).should.eql(['C']);
	})

	it('should classify 2-class samples', function() {
		classifier.classify({I:1 , want:1 , aa:1 , and:1 , bb:1 },explain).should.eql(['A','B']);
		classifier.classify({I:1 , want:1 , bb:1 , and:1 , cc:1 },explain).should.eql(['B','C']);
		classifier.classify({I:1 , want:1 , cc:1 , and:1 , aa:1 },explain).should.eql(['A','C']);
	})

	it('should classify 3-class samples', function() {
		classifier.classify({I:1 , want:1 , aa:1 , and:1 , bb:1 , "'": true, cc:1 },explain).should.eql(['A','B','C']);
	})

	it('should classify 0-class samples', function() {
		classifier.classify({I:1 , want:1 , nothing:1 },explain).should.eql([]);
	})
})
