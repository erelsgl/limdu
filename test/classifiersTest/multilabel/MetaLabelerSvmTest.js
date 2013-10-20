/**
 * a unit-test for Multi-Label classification in the Meta-Labeler method,
 * with Modified Balanced Winnow as the underlying binary classifier.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

var should = require('should');
var util = require('util');
var classifiers = require('../../../classifiers');
var ftrs = require('../../../features');

require('../../sorted');

function test(name, SvmClassifier) {
	
	var retrain_count = 10;
	var BinaryRelevanceSvm = classifiers.multilabel.BinaryRelevance.bind(this, {
		binaryClassifierType: SvmClassifier,
	});

	var MetaLabelerSvm = classifiers.EnhancedClassifier.bind(this, { 
		classifierType: classifiers.multilabel.MetaLabeler.bind(this, {
			rankerType: BinaryRelevanceSvm,
			counterType: BinaryRelevanceSvm
		}),
		featureLookupTable: new ftrs.FeatureLookupTable()
	});
	
	var dataset = [
	       		{input: {I:1 , want:1 , aa:1 }, output: 'A'},      // train on single class
	    		{input: {I:1 , want:1 , bb:1 }, output: ['B']},    // train on array with single class (same effect)
	    		{input: {I:1 , want:1 , cc:1 }, output: [{C:"c"}]},// train on structured class, that will be stringified to "{C:c}".
	    	];
	
	
	describe('Meta-Labeler with '+name+', batch-trained on Single-class inputs,', function() {
		var classifierBatch = new MetaLabelerSvm();
		classifierBatch.trainBatch(dataset);
		
		//console.log(util.inspect(classifierBatch, {depth:6}));
		
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
			ab.should.have.property('explanation').with.property('ranking');
			ab.should.have.property('explanation').with.property('counting');
		})
	})
	
	
	
	describe('Meta-Labeler with '+name+', batch-trained on two-class inputs,', function() {
		var classifier = new MetaLabelerSvm();
		classifier.trainBatch([
			{input: {I:1 , want:1 , aa:1 , bb:1 }, output: ['A','B']},    // train on array with classes
			{input: {I:1 , want:1 , bb:1 , cc:1 }, output: ['B','C']},    // train on array with classes
			{input: {I:1 , want:1 , cc:1 , dd:1 }, output: ['C','D']},   // train on set of classes
			{input: {I:1 , want:1 , dd:1 , aa:1 }, output: ['D','A']},   // train on set of classes
		]);
		//console.log(util.inspect(classifier, {depth:6}));

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
}

if (classifiers.SvmPerf.isInstalled())
	test("SVM-Perf", classifiers.SvmPerf.bind(this,{learn_args: "-c 20.0", model_file_prefix: __dirname+"/../../tempfiles/SvmPerf"}));
else
	console.warn("svm_perf_learn not found - MetaLabelerSvmPerf tests skipped.")

if (classifiers.SvmLinear.isInstalled())
	test("SVM-LibLinear", classifiers.SvmLinear.bind(this,{learn_args: "-c 20.0", model_file_prefix: __dirname+"/../../tempfiles/SvmLinear"}));
else
	console.warn("liblinear_train not found - MetaLabelerSvmLinear tests skipped.")

