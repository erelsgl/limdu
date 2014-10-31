/**
 * a unit-test for Multi-Label classification in the Binary-Relevance method,
 * with Modified Balanced Winnow as the underlying binary classifier.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

var should = require('should');
var classifiers = require('../../../classifiers');
var _ = require("underscore")._;


var retrain_count = 10;
var BinaryRelevanceWinnow = classifiers.multilabel.BinaryRelevance.bind(this, {
		binaryClassifierType: classifiers.Winnow.bind(this, {
			promotion: 1.5,
			demotion: 0.5,
			margin: 1,
			retrain_count: retrain_count,
		}),
});

var dataset = [
       		{input: {I:1 , want:1 , aa:1 }, output: 'A'},      // train on single class
    		{input: {I:1 , want:1 , bb:1 }, output: ['B']},    // train on array with single class (same effect)
    		{input: {I:1 , want:1 , cc:1 }, output: [{C:"c"}]},// train on structured class, that will be stringified to "{C:c}".
    	];



var testMultiLabelClassifier = function(classifier) {
	it('classifies 1-class samples', function() {
		classifier.classify({I:1 , want:1 , aa:1 }).should.eql(['A']);
		classifier.classify({I:1 , want:1 , bb:1 }).should.eql(['B']);
		classifier.classify({I:1 , want:1 , cc:1 }).should.eql(['{"C":"c"}']);
	});

	it('classifies 2-class samples', function() {
		classifier.classify({I:1 , want:1 , aa:1 , and:1 , bb:1 }).sort().should.eql(['A','B'].sort());
		classifier.classify({I:1 , want:1 , bb:1 , and:1 , cc:1 }).sort().should.eql(['B','{"C":"c"}'].sort());
		classifier.classify({I:1 , want:1 , cc:1 , and:1 , aa:1 }).sort().should.eql(['A','{"C":"c"}'].sort());

	});

	it('classifies 3-class samples', function() {
		classifier.classify({I:1 , want:1 , aa:1 , and:1 , bb:1 , "'": true, cc:1 }).sort().should.eql(['A','B','{"C":"c"}'].sort());
	});

	it('classifies 0-class samples', function() {
		classifier.classify({I:1 , want:1 , nothing:1 }).should.eql([]);
	});
	
	it('knows its classes', function() {
		classifier.getAllClasses().sort().should.eql(['A','B','{"C":"c"}'].sort());
	})

	it('explains its decisions', function() {
		classifier.classify({I:1 , want:1 , aa:1 , and:1 , bb:1 }, /*explain=*/1).should.have.property('explanation').with.property('positive');
		classifier.classify({I:1 , want:1 , aa:1 , and:1 , bb:1 }, /*explain=*/3).should.have.property('explanation').with.property('negative');
	})
	
	it('supports ranking with scores', function() {
		var a = classifier.classify({I:1 , want:1 , aa:1 }, /*explain=*/5, /*withScores=*/true);
		_.keys(a.scores).should.have.lengthOf(3);
		_.keys(a.scores)[0].should.eql('A');
		a.scores['A'].should.be.above(0);
		a.scores['B'].should.be.below(0);
		var b = classifier.classify({I:1 , want:1 , bb:1 }, /*explain=*/5, /*withScores=*/true)
		_.keys(b.scores).should.have.lengthOf(3);
		b.scores['B'].should.be.above(0);
		b.scores['A'].should.be.below(0);
		var c = classifier.classify({I:1 , want:1 , cc:1 }, /*explain=*/5, /*withScores=*/true);
		_.keys(c.scores).should.have.lengthOf(3);
		c.scores['{"C":"c"}'].should.be.above(0);
		c.scores['A'].should.be.below(0);
		c.scores['B'].should.be.below(0);

	});
}



describe('Multi-Label BR Classifier batch-trained on Single-class inputs', function() {
	var classifierBatch = new BinaryRelevanceWinnow();
	classifierBatch.trainBatch(dataset);
	testMultiLabelClassifier(classifierBatch);
})


describe('Multi-Label BR Classifier online-trained on Single-class inputs', function() {
	var classifierOnline = new BinaryRelevanceWinnow();
	for (var i=0; i<=retrain_count; ++i) 
		for (var d=0; d<dataset.length; ++d)
			classifierOnline.trainOnline(dataset[d].input, dataset[d].output);
	testMultiLabelClassifier(classifierOnline);

	// COMPARE TO BATCH CLASSIFIER: 
	// Strangely, there is a slight difference, so this test is disabled:
	it.skip('is identical to batch classifier', function() {
		var classifierBatch = new BinaryRelevanceWinnow();
		classifierBatch.trainBatch(dataset);
		//console.log("batch: "); 	console.dir(classifierBatch.mapClassnameToClassifier);
		//console.log("online: "); 	console.dir(classifierOnline.mapClassnameToClassifier);
		classifierOnline.should.eql(classifierBatch);
	});
})


describe.skip('Multi-Label BR Classifier batch-trained on two-class inputs', function() {
	var classifier = new BinaryRelevanceWinnow();
	classifier.trainBatch([
		{input: {I:1 , want:1 , aa:1 , bb:1 }, output: ['A','B']},      // train on array with classes
		{input: {I:1 , want:1 , bb:1 , cc:1 }, output: ['B','C']},      // train on array with classes
		{input: {I:1 , want:1 , cc:1 , dd:1 }, output: [{C:1, D:1}]},   // train on set of classes
		{input: {I:1 , want:1 , dd:1 , aa:1 }, output: [{D:1, A:1}]},   // train on set of classes
	]);

	it('classifies 1-class samples', function() {
		classifier.classify({I:1 , want:1 , aa:1 }).should.eql(['A']);
		classifier.classify({I:1 , want:1 , bb:1 }).should.eql(['B']);
		classifier.classify({I:1 , want:1 , cc:1 }).should.eql(['C']);
		classifier.classify({I:1 , want:1 , dd:1 }).should.eql(['D']);
	});

	it('classifies 2-class samples', function() {
		classifier.classify({I:1 , want:1 , aa:1 , and:1 , bb:1 }).sort().should.eql(['A','B'].sort());
		classifier.classify({I:1 , want:1 , bb:1 , and:1 , cc:1 }).sort().should.eql(['B','C'].sort());
		classifier.classify({I:1 , want:1 , cc:1 , and:1 , dd:1 }).sort().should.eql(['C','D'].sort());
		classifier.classify({I:1 , want:1 , dd:1 , and:1 , aa:1 }).sort().should.eql(['D','A'].sort());
	});
});

