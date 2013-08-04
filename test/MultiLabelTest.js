/**
 * a unit-test for Multi-Label classification
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

var should = require('should');
var classifiers = require('../classifiers');

var classifier = new classifiers.BinaryClassifierSet({
	'binaryClassifierType': classifiers.Winnow,
	'binaryClassifierOptions': {
		promotion: 1.5,
		demotion: 0.5,
		retrain_count: 10,
	},
});

classifier.trainBatch([
	{input: {I:true, want:true, a:true}, output: ['A']},
	{input: {I:true, want:true, b:true}, output: ['B']},
	{input: {I:true, want:true, c:true}, output: ['C']},
]);

var explain=0;

describe('Multi-Label Classification - Short', function() {
	it('should classify 1-class samples', function() {
		classifier.classify({I:true, want:true, a:true},explain).should.eql(['A']);
		classifier.classify({I:true, want:true, b:true},explain).should.eql(['B']);
		classifier.classify({I:true, want:true, c:true},explain).should.eql(['C']);
	})

	it('should classify 2-class samples', function() {
		classifier.classify({I:true, want:true, a:true, and:true, b:true},explain).should.eql(['A','B']);
		classifier.classify({I:true, want:true, b:true, and:true, c:true},explain).should.eql(['B','C']);
		classifier.classify({I:true, want:true, c:true, and:true, a:true},explain).should.eql(['A','C']);
	})

	it('should classify 3-class samples', function() {
		classifier.classify({I:true, want:true, a:true, and:true, b:true, "'": true, c:true},explain).should.eql(['A','B','C']);
	})

	it('should classify 0-class samples', function() {
		classifier.classify({I:true, want:true, nothing:true},explain).should.eql([]);
	})
})

describe('Multi-Label Classification - Long', function() {
	it('should classify 1-class samples', function() {
		classifier.classify({I:true, want:true, a:true},explain).should.eql(['A']);
		classifier.classify({I:true, want:true, b:true},explain).should.eql(['B']);
		classifier.classify({I:true, want:true, c:true},explain).should.eql(['C']);
	})

	it('should classify 2-class samples', function() {
		classifier.classify({I:true, want:true, a:true, and:true, b:true},explain).should.eql(['A','B']);
		classifier.classify({I:true, want:true, b:true, and:true, c:true},explain).should.eql(['B','C']);
		classifier.classify({I:true, want:true, c:true, and:true, a:true},explain).should.eql(['A','C']);
	})

	it('should classify 3-class samples', function() {
		classifier.classify({I:true, want:true, a:true, and:true, b:true, "'": true, c:true},explain).should.eql(['A','B','C']);
	})

	it('should classify 0-class samples', function() {
		classifier.classify({I:true, want:true, nothing:true},explain).should.eql([]);
	})
})
