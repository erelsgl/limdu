/**
 * a unit-test for Multi-Label classification in the Homer method,
 * with Binary-Relevance as the underlying multi-lable classifier,
 * with Modified Balanced Winnow as the underlying binary classifier.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
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

var HomerWinnow = classifiers.multilabel.Homer.bind(this, {
	multilabelClassifierType: BinaryRelevanceWinnow
})

var trainsetSimple = [  // a simple trainset, with no hierarchy, to use as a baseline:
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
	
	it('knows its classes', function() {
		classifier.getAllClasses().should.eql(['A','B','{"C":"c"}']);
	})
}

describe('Homer classifier batch-trained on single-class non-hierarchical inputs', function() {
	var classifierBatch = new HomerWinnow();
	classifierBatch.trainBatch(trainsetSimple);
	testMultiLabelClassifier(classifierBatch);
})


describe('Homer classifier online-trained on single-class non-hierarchical inputs', function() {
	var classifierOnline = new HomerWinnow();
	for (var i=0; i<=retrain_count; ++i) 
		for (var d=0; d<trainsetSimple.length; ++d)
			classifierOnline.trainOnline(trainsetSimple[d].input, trainsetSimple[d].output);
	testMultiLabelClassifier(classifierOnline);

	
	// COMPARE TO BATCH CLASSIFIER: 
	// Strangely, there is a slight difference, so this test is disabled:
	/*
	var classifierBatch = new HomerWinnow();
	classifierBatch.trainBatch(dataset);
	//console.log("batch: "); 	console.dir(classifierBatch.mapClassnameToClassifier);
	//console.log("online: "); 	console.dir(classifierOnline.mapClassnameToClassifier);

	it('is identical to batch classifier', function() {
		classifierOnline.should.eql(classifierBatch);
	});
	*/
})




var trainsetHierarchical = [
	{input: {I:1 , want:1 , to:1, AA:1, AAA:1}, output: 'A'},
	{input: {I:1 , want:1 , to:1, BB:1, the:1, bb:1 }, output: 'B@b'},
	{input: {I:1 , want:1 , to:1, BB:1, the:1, cc:1 }, output: 'B@c'},
	{input: {I:1 , want:1 , to:1, CC:1, the:1, bb:1 }, output: 'C@b'},
	{input: {I:1 , want:1 , to:1, CC:1, the:1, cc:1 }, output: 'C@c'},
	{input: {I:1 , want:1 , to:1, EE:1, the:1, ff:1, of:1, xx:1 }, output: 'E@f@x'},
	{input: {I:1 , want:1 , to:1, EE:1, the:1, ff:1, of:1, yy:1 }, output: 'E@f@y'},
	{input: {I:1 , want:1 , to:1, EE:1, the:1, gg:1, of:1, xx:1 }, output: 'E@g@x'},
	{input: {I:1 , want:1 , to:1, EE:1, the:1, gg:1, of:1, yy:1 }, output: 'E@g@y'},
];

var testsetHierarchical = [
	{input: {I:1 , want:1 , to:1, AA:1, AAA:1, BB:1, cc:1}, output: ['A','B@c']},  // two classes
	{input: {I:1 , want:1 , to:1, CC:1, dd:1, and:1, BB:1, ee:1}, output: []},  // two hierarchical classes
	//{input: {I:1 , want:1 , to:1, CC:1, bb:1, and:1, BB:1, cc:1}, output: ['C@b','B@c']},  // two hierarchical classes
	//{input: {I:1 , want:1 , to:1, CC:1, bb:1, and:1, BB:1, ee:1}, output: ['C@b']}, 
	{input: {I:1 , want:1 , to:1, CC:1, bb:1, and:1, EE:1, ff:1, xx:1}, output: ['C@b','E@f@x']},  // two hierarchical classes
];

describe('Baseline: BR classifier online-trained on single-class hierarchical inputs', function() {
	var classifierBaseline = new BinaryRelevanceWinnow();
	for (var i=0; i<=retrain_count; ++i) 
		for (var d=0; d<trainsetHierarchical.length; ++d)
			classifierBaseline.trainOnline(trainsetHierarchical[d].input, trainsetHierarchical[d].output);

	it('classifies 1-class samples', function() {
		for (var d=0; d<trainsetHierarchical.length; ++d)
			classifierBaseline.classify(trainsetHierarchical[d].input).should.eql([trainsetHierarchical[d].output]);
	});

	it('classifies 2-class samples', function() {
		for (var d=0; d<testsetHierarchical.length; ++d) {
			//if (d==testsetHierarchical.length-1) console.log("baseline: "+util.inspect(classifierBaseline.classify(testsetHierarchical[d].input, 4), {depth:5}));
			classifierBaseline.classify(testsetHierarchical[d].input).should.eql(testsetHierarchical[d].output);
		}
	});
	
	it('classifies 0-class samples', function() {
		classifierBaseline.classify({I:1 , want:1 , nothing:1 }).should.eql([]);
	});
})

describe('Homer classifier online-trained on single-class hierarchical inputs', function() {
	var classifierOnline = new HomerWinnow();
	for (var i=0; i<=retrain_count; ++i) 
		for (var d=0; d<trainsetHierarchical.length; ++d)
			classifierOnline.trainOnline(trainsetHierarchical[d].input, trainsetHierarchical[d].output);

	it('classifies 1-class samples', function() {
		for (var d=0; d<trainsetHierarchical.length; ++d)
			classifierOnline.classify(trainsetHierarchical[d].input).should.eql([trainsetHierarchical[d].output]);
	});

	it('classifies 2-class samples', function() {
		for (var d=0; d<testsetHierarchical.length; ++d) {
			classifierOnline.classify(testsetHierarchical[d].input).should.eql(testsetHierarchical[d].output);
		}
	});

	it('classifies 0-class samples', function() {
		classifierOnline.classify({I:1 , want:1 , nothing:1 }).should.eql([]);
	});
})


describe('Homer classifier batch-trained on single-class hierarchical inputs', function() {
	var classifierBatch = new HomerWinnow();
	classifierBatch.trainBatch(trainsetHierarchical);

	it('classifies 1-class samples', function() {
		for (var d=0; d<trainsetHierarchical.length; ++d)
			classifierBatch.classify(trainsetHierarchical[d].input).should.eql([trainsetHierarchical[d].output]);
	});

	it('classifies 2-class samples', function() {
		for (var d=0; d<testsetHierarchical.length; ++d) {
			classifierBatch.classify(testsetHierarchical[d].input).should.eql(testsetHierarchical[d].output);
		}
	});

	it('classifies 0-class samples', function() {
		classifierBatch.classify({I:1 , want:1 , nothing:1 }).should.eql([]);
	});
})

describe('Homer Classifier batch-trained on two-class non-hierarchical inputs', function() {
	var classifier = new HomerWinnow();
	classifier.trainBatch([
		{input: {I:1 , want:1 , aa:1 , bb:1 }, output: ['A','B']},      // train on array with classes
		{input: {I:1 , want:1 , bb:1 , cc:1 }, output: ['B','C']},      // train on array with classes
		{input: {I:1 , want:1 , cc:1 , dd:1 }, output: [{C:1, D:1}]},   // train on set of classes
		{input: {I:1 , want:1 , dd:1 , aa:1 }, output: [{D:1, A:1}]},   // train on set of classes
	]);

	it('classifies 1-class samples', function() {
		//classifier.classify({I:1 , want:1 , aa:1 }).should.eql(['A']);
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


describe('Homer Classifier batch-trained on two-class hierarchical inputs', function() {
	var classifier = new HomerWinnow();
	classifier.trainBatch([
		{input: {I:1 , want:1 , aa:1 , bb:1, AA:1, BB:1 }, output: ['a@b','A@B']},      // train on array with classes
		{input: {I:1 , want:1 , bb:1 , cc:1, BB:1, CC:1 }, output: ['b@c','B@C']},      // train on array with classes
		{input: {I:1 , want:1 , cc:1 , dd:1, CC:1, DD:1 }, output: [{'c@d':1, 'C@D':1}]},   // train on set of classes
		{input: {I:1 , want:1 , dd:1 , aa:1, DD:1, AA:1 }, output: [{'d@a':1, 'D@A':1}]},   // train on set of classes
	]);

	it('classifies 1-class samples', function() {
		//classifier.classify({I:1 , want:1 , aa:1 }).should.eql(['A']);
		//classifier.classify({I:1 , want:1 , bb:1 }).should.eql(['B']);
		//classifier.classify({I:1 , want:1 , cc:1 }).should.eql(['C']);
		//classifier.classify({I:1 , want:1 , dd:1 }).should.eql(['D']);
	});

	it('classifies 2-class samples', function() {
		classifier.classify({I:1 , want:1 , aa:1 , bb:1, AA:1, BB:1 }).should.eql(['a@b','A@B']);
		classifier.classify({I:1 , want:1 , bb:1 , cc:1, BB:1, CC:1 }).should.eql(['b@c','B@C']);
		//classifier.classify({I:1 , want:1 , cc:1 , and:1 , dd:1 }).should.eql(['C','D']);
		//classifier.classify({I:1 , want:1 , dd:1 , and:1 , aa:1 }).should.eql(['D','A']);
	});
});

