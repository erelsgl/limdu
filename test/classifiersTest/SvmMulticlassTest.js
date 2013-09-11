/**
 * a unit-test for SvmLinear classifier (a wrapper for LibLinear), as a multi-class classifier.
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
		        		{input: [0,0], output: 3},
		        		{input: [1,1], output: 3},
		        		
		        		{input: [0,1], output: 4},
		        		{input: [1,2], output: 4},
		        		
		        		{input: [0,2], output: 5},
		        		{input: [1,3], output: 5},
		        		];
	
		var classifier = new SvmClassifier();
		classifier.trainBatch(trainSet);
		
		it('supports multi-class output', function() {
			classifier.classify([1,0]).should.equal(3);
			classifier.classify([0,1.3]).should.equal(4);
			classifier.classify([0,1.7]).should.equal(5);
			classifier.classify([0,3]).should.equal(5);
		})
		
		it('explains its decisions', function() {
			classifier.classify([1,0], 3).should.have.property("explanation").with.lengthOf(3);
			classifier.classify([0,2], 5).should.have.property("explanation").with.lengthOf(3);
		})
		
		it('supports classification with scores', function() {
			classifier.classify([1,0],0,true).should.have.lengthOf(3);
			classifier.classify([0,1.3],0,true)[0].should.have.lengthOf(2);
			classifier.classify([0,1.7],0,true)[0][0].should.equal(5);
			classifier.classify([0,3],0,true)[0][1].should.be.within(2.5,3.5);
		})
	})

	var SvmClassifierStringFeatures = classifiers.EnhancedClassifier.bind(this, 	{
		classifierType: SvmClassifier, 
		featureLookupTable: new ftrs.FeatureLookupTable()
	});
} // end of function


//test("SVM-Perf", classifiers.SvmPerf.bind(this,{learn_args: "-c 20.0"}));
test("SVM-LibLinear", classifiers.SvmLinear.where({multiclass: true, learn_args: "-c 20.0"}));
//test("SVM.js", classifiers.SvmJs.bind(this,{C: 20.0})); // handled by SvmJsTest
