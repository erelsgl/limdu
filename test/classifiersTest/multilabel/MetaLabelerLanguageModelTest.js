/**
 * a unit-test for Multi-Label classification in the Meta-Labeler method,
 * with Cross-Language-Model as the underlying ranker.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

var should = require('should');
var classifiers = require('../../../classifiers');
require('../../sorted');

var BinaryRelevanceWinnow = classifiers.multilabel.BinaryRelevance.bind(this, {
		binaryClassifierType: classifiers.Winnow.bind(this, {
			promotion: 1.5,
			demotion: 0.5,
			margin: 1,
			retrain_count: 10,
		}),
});

var CrossLanguageModelClassifier = classifiers.multilabel.CrossLanguageModel.bind(this, {
	smoothingFactor : 0.9,
	labelFeatureExtractor: function(string, features) {
		if (!features) features = {};
		features[string]=1;
		return features;
	}
});

var MetaLabelerLanguageModel = classifiers.multilabel.MetaLabeler.bind(this, {
	rankerType: CrossLanguageModelClassifier,
	counterType: BinaryRelevanceWinnow
});

var dataset = [
       		{input: {I:1 , want:1 , aa:1 }, output: 'A'},      // train on single class
    		{input: {I:1 , want:1 , bb:1 }, output: ['B']},    // train on array with single class (same effect)
    		{input: {I:1 , want:1 , cc:1 }, output: 'C'},
    	];


describe('CLIR Meta-Labeler batch-trained on Single-class inputs', function() {
	var classifierBatch = new MetaLabelerLanguageModel();
	classifierBatch.trainBatch(dataset);
	
	var classifier = classifierBatch;

	it('classifies 1-class samples', function() {
		classifier.classify({I:1 , want:1 , aa:1 }).should.eql(['A']);
		classifier.classify({I:1 , want:1 , bb:1 }).should.eql(['B']);
		classifier.classify({I:1 , want:1 , cc:1 }).should.eql(['C']);
	});
	
	it('knows its classes', function() {
		classifier.getAllClasses().should.eql(['A','B','C']);
	})

	it('explains its decisions', function() {
		var ab = classifier.classify({I:1 , want:1 , aa:1 , and:1 , bb:1 }, /*explain=*/3);
		ab.should.have.property('explanation').with.property('ranking');
		ab.should.have.property('explanation').with.property('counting');
	})
})


describe('CLIR Meta-Labeler batch-trained on two-class inputs', function() {
	var classifier = new MetaLabelerLanguageModel();
	classifier.trainBatch([
		{input: {I:1 , want:1 , aa:1 , bb:1 }, output: ['A','B']},    // train on array with classes
		{input: {I:1 , want:1 , bb:1 , cc:1 }, output: ['B','C']},    // train on array with classes
		{input: {I:1 , want:1 , cc:1 , dd:1 }, output: ['C','D']},
		{input: {I:1 , want:1 , dd:1 , aa:1 }, output: ['D','A']},   
	]);

	it('classifies 2-class samples', function() {
		classifier.classify({I:1 , want:1 , aa:1 , and:1 , bb:1 }).sorted().should.eql(['A','B']);
		classifier.classify({I:1 , want:1 , bb:1 , and:1 , cc:1 }).sorted().should.eql(['B','C']);
		classifier.classify({I:1 , want:1 , cc:1 , and:1 , dd:1 }).sorted().should.eql(['C','D']);
		classifier.classify({I:1 , want:1 , dd:1 , and:1 , aa:1 }).sorted().should.eql(['A','D']);
	});

	it('explains its decisions', function() {
		classifier.classify({I:1 , want:1 , aa:1 , and:1 , bb:1 }, /*explain=*/1).should.have.property('explanation').with.property('ranking').with.lengthOf(4);
		classifier.classify({I:1 , want:1 , aa:1 , and:1 , bb:1 }, /*explain=*/3).should.have.property('explanation').with.property('counting').with.lengthOf(1);
	})
});
