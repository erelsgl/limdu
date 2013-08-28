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

var dataset = [
       		{input: {I:1 , want:1 , aa:1 }, output: 'A'},      // train on single class
    		{input: {I:1 , want:1 , bb:1 }, output: ['B']},    // train on array with single class (same effect)
    		{input: {I:1 , want:1 , cc:1 }, output: [{C:"c"}]},// train on structured class, that will be stringified to "{C:c}".
    	];

//describe('Homer classifier batch-trained on single-class inputs', function() {
//	var classifierBatch = new HomerWinnow();
//	classifierBatch.trainBatch(dataset);
//	//console.log("batch: "); 	console.dir(classifierOnline.mapClassnameToClassifier);
//
//	it('classifies 1-class samples', function() {
//		classifierBatch.classify({I:1 , want:1 , aa:1 }).should.eql(['A']);
//		classifierBatch.classify({I:1 , want:1 , bb:1 }).should.eql(['B']);
//		classifierBatch.classify({I:1 , want:1 , cc:1 }).should.eql(['{"C":"c"}']);
//	});
//
//	it('classifies 2-class samples', function() {
//		classifierBatch.classify({I:1 , want:1 , aa:1 , and:1 , bb:1 }).should.eql(['A','B']);
//		classifierBatch.classify({I:1 , want:1 , bb:1 , and:1 , cc:1 }).should.eql(['B','{"C":"c"}']);
//		classifierBatch.classify({I:1 , want:1 , cc:1 , and:1 , aa:1 }).should.eql(['A','{"C":"c"}']);
//	});
//
//	it('classifies 3-class samples', function() {
//		classifierBatch.classify({I:1 , want:1 , aa:1 , and:1 , bb:1 , "'": true, cc:1 }).should.eql(['A','B','{"C":"c"}']);
//	});
//
//	it('classifies 0-class samples', function() {
//		classifierBatch.classify({I:1 , want:1 , nothing:1 }).should.eql([]);
//	});
//})


describe('Homer classifier online-trained on Single-class inputs', function() {
	var classifierOnline = new HomerWinnow();
	for (var i=0; i<=retrain_count; ++i) 
		for (var d=0; d<dataset.length; ++d)
			classifierOnline.trainOnline(dataset[d].input, dataset[d].output);
	
	//console.log(util.inspect(classifierOnline,{depth:5}));

	it('classifies 1-class samples', function() {
		classifierOnline.classify({I:1 , want:1 , aa:1 }).should.eql(['A']);
		classifierOnline.classify({I:1 , want:1 , bb:1 }).should.eql(['B']);
		classifierOnline.classify({I:1 , want:1 , cc:1 }).should.eql(['{"C":"c"}']);
	});

	it('classifies 2-class samples', function() {
		classifierOnline.classify({I:1 , want:1 , aa:1 , and:1 , bb:1 }).should.eql(['A','B']);
		classifierOnline.classify({I:1 , want:1 , bb:1 , and:1 , cc:1 }).should.eql(['B','{"C":"c"}']);
		classifierOnline.classify({I:1 , want:1 , cc:1 , and:1 , aa:1 }).should.eql(['A','{"C":"c"}']);
	});

	it('classifies 3-class samples', function() {
		classifierOnline.classify({I:1 , want:1 , aa:1 , and:1 , bb:1 , "'": true, cc:1 }).should.eql(['A','B','{"C":"c"}']);
	});

	it('classifies 0-class samples', function() {
		classifierOnline.classify({I:1 , want:1 , nothing:1 }).should.eql([]);
	});
})


//describe('Homer Classifier batch-trained on two-class inputs', function() {
//	var classifier = new HomerWinnow();
//	classifier.trainBatch([
//		{input: {I:1 , want:1 , aa:1 , bb:1 }, output: ['A','B']},      // train on array with classes
//		{input: {I:1 , want:1 , bb:1 , cc:1 }, output: ['B','C']},      // train on array with classes
//		{input: {I:1 , want:1 , cc:1 , dd:1 }, output: [{C:1, D:1}]},   // train on set of classes
//		{input: {I:1 , want:1 , dd:1 , aa:1 }, output: [{D:1, A:1}]},   // train on set of classes
//	]);
//
//	it('classifies 1-class samples', function() {
//		//classifier.classify({I:1 , want:1 , aa:1 }).should.eql(['A']);
//		//classifier.classify({I:1 , want:1 , bb:1 }).should.eql(['B']);
//		//classifier.classify({I:1 , want:1 , cc:1 }).should.eql(['C']);
//		//classifier.classify({I:1 , want:1 , dd:1 }).should.eql(['D']);
//	});
//
//	it('classifies 2-class samples', function() {
//		classifier.classify({I:1 , want:1 , aa:1 , and:1 , bb:1 }).should.eql(['A','B']);
//		classifier.classify({I:1 , want:1 , bb:1 , and:1 , cc:1 }).should.eql(['B','C']);
//		//classifier.classify({I:1 , want:1 , cc:1 , and:1 , dd:1 }).should.eql(['C','D']);
//		//classifier.classify({I:1 , want:1 , dd:1 , and:1 , aa:1 }).should.eql(['D','A']);
//	});
//});
//
