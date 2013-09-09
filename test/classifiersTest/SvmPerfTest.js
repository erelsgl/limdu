/**
 * a unit-test for SvmPerf classifier
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

var should = require('should');
var classifiers = require('../../classifiers');
var ftrs = require('../../features');


var SvmClassifier = classifiers.SvmPerf.bind(this, 	{
	learn_args: "-c 20.0", 
	classify_args: ""
});

describe('SVM-Perf classifier with numeric features', function() {
	var trainSet = [
	        		{input: [0,0], output: 0},
	        		{input: [1,1], output: 0},
	        		{input: [0,1], output: 1},
	        		{input: [1,2], output: 1} ];

	var classifier = new SvmClassifier();
	classifier.trainBatch(trainSet);
	
	it('finds the maximal margin separator', function() {
		// the max-margin separating line goes through [0,0.5] and [1,1.5]. It is:
		//        0.5+x-y = 0
		//  or:   2y-2x-1 = 0
		classifier.modelMap.should.eql({ '0': -1, '1': -2, '2': 2 });
	})
	
	
	it('supports binary output', function() {
		classifier.classify([0,2]).should.eql(1);
		classifier.classify([1,0]).should.eql(0);
	})
	
	it('explains its classifications', function() {
		classifier.classify([0,2], 2).should.have.property("explanation").with.lengthOf(2);
		classifier.classify([1,0], 2).should.have.property("explanation").with.lengthOf(2);
	})
	
	it('supports continuous output', function() {
		classifier.classify([0,2], 0, true).should.be.above(0);
		classifier.classify([1,0], 0, true).should.be.below(0);

		classifier.classify([0,2], 0, true).should.equal(3);
		classifier.classify([1,0], 0, true).should.equal(-3);
	})
})

var SvmClassifierStringFeatures = classifiers.EnhancedClassifier.bind(this, 	{
	classifierType: SvmClassifier, 
	featureLookupTable: new ftrs.FeatureLookupTable()
});
	
describe('SVM-Perf classifier with string features', function() {
	var trainSet = [
	        		{input: {a:0, b:0}, output: 0},
	        		{input: {a:1, b:1}, output: 0},
	        		{input: {a:0, b:1}, output: 1},
	        		{input: {a:1, b:2}, output: 1} ];

	var classifier = new SvmClassifierStringFeatures();
	classifier.trainBatch(trainSet);

	it('supports binary output', function() {
		classifier.classify({a:0, b:2}).should.eql(1);
		classifier.classify({a:1, b:0}).should.eql(0);
	})
	
	it('explains its classifications', function() {
		classifier.classify({a:0, b:2}, 2).should.have.property("explanation").with.lengthOf(2);
		classifier.classify({a:1, b:0}, 2).should.have.property("explanation").with.lengthOf(2);
	})

	it('supports continuous output', function() {
		classifier.classify({a:0, b:2}, 0, true).should.be.above(0);
		classifier.classify({a:1, b:0}, 0, true).should.be.below(0);
	})
})
