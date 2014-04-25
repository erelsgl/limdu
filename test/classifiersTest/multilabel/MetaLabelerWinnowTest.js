/**
 * a unit-test for Multi-Label classification in the Meta-Labeler method,
 * with Modified Balanced Winnow as the underlying binary classifier.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

var should = require('should');
var classifiers = require('../../../classifiers');
require('../../sorted');

var retrain_count = 10;
var BinaryRelevanceWinnow = classifiers.multilabel.BinaryRelevance.bind(this, {
		binaryClassifierType: classifiers.Winnow.bind(this, {
			promotion: 1.5,
			demotion: 0.5,
			margin: 1,
			retrain_count: retrain_count,
		}),
});

var MetaLabelerWinnow = classifiers.multilabel.MetaLabeler.bind(this, {
	rankerType: BinaryRelevanceWinnow,
	counterType: BinaryRelevanceWinnow
});

var dataset = [
       		{input: {I:1 , want:1 , aa:1 }, output: 'A'},      // train on single class
    		{input: {I:1 , want:1 , bb:1 }, output: ['B']},    // train on array with single class (same effect)
    		{input: {I:1 , want:1 , cc:1 }, output: [{C:"c"}]},// train on structured class, that will be stringified to "{C:c}".
    	];


describe('Meta-Labeler batch-trained on Single-class inputs', function() {
	var classifierBatch = new MetaLabelerWinnow();
	classifierBatch.trainBatch(dataset);
	
	var classifier = classifierBatch;
	it('classifies 1-class samples', function() {
		classifier.classify({I:1 , want:1 , aa:1 }).should.eql(['A']);
		classifier.classify({I:1 , want:1 , bb:1 }).should.eql(['B']);
		classifier.classify({I:1 , want:1 , cc:1 }).should.eql(['{"C":"c"}']);
	});
	
	it('knows its classes', function() {
		classifier.getAllClasses().should.eql(['A','B','{"C":"c"}']);
	})

	it('explains its decisions', function() {
		var ab = classifier.classify({I:1 , want:1 , aa:1 , and:1 , bb:1 }, /*explain=*/3);
		//console.dir(ab);
		ab.should.have.property('explanation').with.property('ranking');
		ab.should.have.property('explanation').with.property('counting');
	})
})


describe('Meta-Labeler online-trained on Single-class inputs', function() {
	var classifierOnline = new MetaLabelerWinnow();
	for (var i=0; i<=retrain_count; ++i) 
		for (var d=0; d<dataset.length; ++d)
			classifierOnline.trainOnline(dataset[d].input, dataset[d].output);

	
	var classifier = classifierOnline;
	it('classifies 1-class samples', function() {
		classifier.classify({I:1 , want:1 , aa:1 }).should.eql(['A']);
		classifier.classify({I:1 , want:1 , bb:1 }).should.eql(['B']);
		classifier.classify({I:1 , want:1 , cc:1 }).should.eql(['{"C":"c"}']);
	});
	
	it('knows its classes', function() {
		classifier.getAllClasses().should.eql(['A','B','{"C":"c"}']);
	})

	it('explains its decisions', function() {
		// classifier.classify({I:1 , want:1 , aa:1 , and:1 , bb:1 }, /*explain=*/1).should.have.property('explanation').with.property('ranking').with.lengthOf(3);
		classifier.classify({I:1 , want:1 , aa:1 , and:1 , bb:1 }, /*explain=*/1).should.have.property('explanation').with.property('ranking')
		// classifier.classify({I:1 , want:1 , aa:1 , and:1 , bb:1 }, /*explain=*/3).should.have.property('explanation').with.property('counting').with.lengthOf(1);
		classifier.classify({I:1 , want:1 , aa:1 , and:1 , bb:1 }, /*explain=*/3).should.have.property('explanation').with.property('counting')
	})
})


describe('Meta-Labeler batch-trained on two-class inputs', function() {
	var classifier = new MetaLabelerWinnow();
	classifier.trainBatch([
		{input: {I:1 , want:1 , aa:1 , bb:1 }, output: ['A','B']},    
		{input: {I:1 , want:1 , bb:1 , cc:1 }, output: ['B','C']},    
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
		// classifier.classify({I:1 , want:1 , aa:1 , and:1 , bb:1 }, /*explain=*/1).should.have.property('explanation').with.property('ranking').with.lengthOf(4);
		classifier.classify({I:1 , want:1 , aa:1 , and:1 , bb:1 }, /*explain=*/1).should.have.property('explanation').with.property('ranking')
		// classifier.classify({I:1 , want:1 , aa:1 , and:1 , bb:1 }, /*explain=*/3).should.have.property('explanation').with.property('counting').with.lengthOf(1);
		classifier.classify({I:1 , want:1 , aa:1 , and:1 , bb:1 }, /*explain=*/3).should.have.property('explanation').with.property('counting')
	})
});
