/**
 * a unit-test for Adaboost classifier.
 * 
 * @author Vasily Konovalov
  */

var should = require('should');
var classifiers = require('../../../classifiers');
var ftrs = require('../../../features');

function test(name, AdaboostClassifier) {
	describe(name, function() {
		var trainSet = [
		        		{input: 'aaa', output: [0]},
		        		{input: 'aaa', output: [0]},
		        		{input: 'aaa', output: [0]},
		        		{input: 'bbb', output: [1]}, 
		        		{input: 'bbb', output: [1]}, 
		        		{input: 'bbb', output: [1]}, 
		        		{input: 'ccc', output: [1]},
		        		{input: 'ccc', output: [1]},
		        		{input: 'ccc', output: [1]} 
		        		];
	
		var classifier = new AdaboostClassifier();
		classifier.trainBatch(trainSet);
		
		it('classify correctly', function() {
			classifier.classify('aaa').should.eql(['0']);
			classifier.classify('bbb').should.eql(['1']);
			classifier.classify('ccc').should.eql(['1']);
		})
	})
} // end of function

if (classifiers.multilabel.Adaboost.isInstalled())
	test("Adaboost", classifiers.multilabel.Adaboost.bind(this,{}));
else
	console.warn("icsiboost not found - Adaboost tests skipped.")
