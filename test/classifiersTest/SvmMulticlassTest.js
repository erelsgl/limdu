/**
 * a unit-test for SvmLinear classifier (a wrapper for LibLinear), as a multi-class classifier.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

var should = require('should');
var classifiers = require('../../classifiers');
var ftrs = require('../../features');

if (!classifiers.SvmLinear.isInstalled()) {
	console.warn("liblinear_train not found - SvmMulticlass tests skipped.");
} else {
	
	var SvmClassifier = classifiers.SvmLinear.bind(0,{
		multiclass: true, 
		learn_args: "-c 20.0"
	});
	
	describe('SVM-LibLinear multiclass'+' with numeric features and numeric labels', function() {
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
	
	var SvmClassifierStringLabels = classifiers.EnhancedClassifier.bind(this, 	{
		classifierType: SvmClassifier, 
		labelLookupTable: new ftrs.FeatureLookupTable()
	});
	
	
	describe('SVM-LibLinear multiclass'+' with numeric features and string labels', function() {
		var trainSet = [
		        		{input: [0,0], output: 'a'},
		        		{input: [1,1], output: 'a'},
		        		
		        		{input: [0,1], output: 'b'},
		        		{input: [1,2], output: 'b'},
		        		
		        		{input: [0,2], output: 'c'},
		        		{input: [1,3], output: 'c'},
		        		];
	
		var classifier = new SvmClassifierStringLabels();
		classifier.trainBatch(trainSet);
		
		it('supports multi-class output', function() {
			classifier.classify([1,0]).should.equal('a');
			classifier.classify([0,1.3]).should.equal('b');
			classifier.classify([0,1.7]).should.equal('c');
			classifier.classify([0,3]).should.equal('c');
		})
		
		it('explains its decisions', function() {
			classifier.classify([1,0], 3).should.have.property("explanation").with.lengthOf(3);
			classifier.classify([0,2], 5).should.have.property("explanation").with.lengthOf(3);
		})
		
		it('supports classification with scores', function() {
			classifier.classify([1,0],0,true).should.have.lengthOf(3);
			classifier.classify([0,1.3],0,true)[0].should.have.lengthOf(2);
			classifier.classify([0,1.7],0,true)[0][0].should.equal('c');  // must be the first!
			classifier.classify([0,3],0,true)[0][1].should.be.within(2.5,3.5);
		})
	})
}	
