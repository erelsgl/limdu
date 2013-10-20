/**
 * a unit-test for SvmLinear classifier (a wrapper for LibLinear) and SvmPerf classifier.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

var should = require('should');
var classifiers = require('../../classifiers');
var ftrs = require('../../features');

function test(name, SvmClassifier) {
	describe(name+' with numeric features', function() {
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
			//classifier.modelMap.should.eql({ '0': -1, '1': -2, '2': 2 });  // the LibLinear algorithm is not accurate:
			var modelWeights = classifier.getModelWeights();
			modelWeights[0].should.be.within(-1.5,-0.5);
			modelWeights[1].should.be.within(-2.5,-1.5);
			modelWeights[2].should.be.within(1.5,2.5);
		})
		
		
		it('supports binary output', function() {
			classifier.classify([0,2]).should.eql(1);
			classifier.classify([1,0]).should.eql(0);
		})
		
		it('explains its decisions', function() {
			classifier.classify([0,2], 2).should.have.property("explanation").with.lengthOf(2);
			classifier.classify([1,0], 3).should.have.property("explanation").with.lengthOf(3);
		})
		
		it('supports continuous output', function() {
			classifier.classify([0,2], 0, true).should.be.within(2.5,3.5);  // should equal 3, but it is not accurate enough
			classifier.classify([1,0], 0, true).should.be.within(-3.5,-2.5);// should equal -3, but it is not accurate enough
		})
	})

	var SvmClassifierStringFeatures = classifiers.EnhancedClassifier.bind(this, 	{
		classifierType: SvmClassifier, 
		featureLookupTable: new ftrs.FeatureLookupTable()
	});

	describe(name+' with string features', function() {
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
			classifier.classify({a:1, b:0}, 3).should.have.property("explanation").with.lengthOf(3);
		})

		it('supports continuous output', function() {
			classifier.classify({a:0, b:2}, 0, true).should.be.above(0);
			classifier.classify({a:1, b:0}, 0, true).should.be.below(0);
		})
	})
} // end of function


if (classifiers.SvmPerf.isInstalled())
	test("SVM-Perf", classifiers.SvmPerf.bind(this,{learn_args: "-c 20.0"}));
else
	console.warn("svm_perf_learn not found - SvmPerf tests skipped.")

if (classifiers.SvmLinear.isInstalled())
	test("SVM-LibLinear", classifiers.SvmLinear.bind(this,{learn_args: "-c 20.0"}));
else
	console.warn("liblinear_train not found - SvmLinear tests skipped.")
	
