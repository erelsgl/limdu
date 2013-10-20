/**
 * a unit-test for Multi-Label classification in the multiclass segmentation method
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

var should = require('should');
var classifiers = require('../../../classifiers');
var ftrs = require('../../../features');
require('../../sorted');

var MulticlassSegmentationBayes = classifiers.multilabel.MulticlassSegmentation.bind(this, {
		multiclassClassifierType: classifiers.Bayesian.bind(this, {
			calculateRelativeProbabilities: true
		}),
		featureExtractor: ftrs.NGramsOfWords(1),
});

// MulticlassSegmentationBayes is now in repair
describe.skip('Multi-Label MCS Classifier Trained on Single-class inputs', function() {
	var classifier = new MulticlassSegmentationBayes();
	classifier.trainBatch([
		{input: "I want aa", output: 'A'},
		{input: "I want bb", output: 'B'},
		{input: "I want cc", output: 'C'},
	]);
	
	it('classifies 1-class samples', function() {
		classifier.classify("I want aa").should.eql(['A']);
		classifier.classify("I want bb").should.eql(['B']);
		classifier.classify("I want cc").should.eql(['C']);
	});

	it('classifies 2-class samples', function() {
		classifier.classify("I want aa bb").sorted().should.eql(['A','B']);
		classifier.classify("I want bb cc").sorted().should.eql(['B','C']);
		classifier.classify("I want cc aa").sorted().should.eql(['A','C']);
	});

	it('classifies 2-class samples with a redundant word', function() {
		classifier.classify("I want aa and bb").sorted().should.eql(['A','B']);
		classifier.classify("I want bb and cc").sorted().should.eql(['B','C']);
		classifier.classify("I want cc and aa").sorted().should.eql(['A','C']);
	});

	it('classifies 3-class samples', function() {
		classifier.classify("I want cc and aa and bb").sorted().should.eql(['A','B','C']);
	});

	// TODO: fix this case
//	it('classifies 0-class samples', function() {
//		classifier.classify("I want nothing").should.eql([]);
//	});
})

/*describe('Multi-Label MCS Classifier Trained on two-class inputs', function() {
	var classifier = new MulticlassSegmentationBayes();
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