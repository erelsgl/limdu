/**
 * a unit-test for Enhanced Classifier
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

var should = require('should');
var classifiers = require('../../classifiers');
var ftrs = require('../../features');

describe('baseline - classifier without a normalizer', function() {
	it('errs on non-normalized sentencs', function() {
		var spamClassifier = new classifiers.EnhancedClassifier({
			classifierType:   classifiers.NeuralNetwork,
			featureExtractor: ftrs.NGramsOfWords(1),
			normalizer: null,
		});

		spamClassifier.trainBatch([
   			{input: "cheaper watches", output: [1]},
   			{input: "", output: [0]},
   		]);

		spamClassifier.classify("cheaper watches").should.be.above(0.8);  // high number (spam)
   		spamClassifier.classify("cheapest watch es").should.be.below(0.2);  // very high number (spam)
   		spamClassifier.classify("cheapless clocks").should.be.below(0.2);  // low number (not spam)
	})
})

describe('classifier with a single normalizer', function() {
	it('classifies sentences correctly', function() {
		var spamClassifier = new classifiers.EnhancedClassifier({
			classifierType:   classifiers.NeuralNetwork,
			featureExtractor: ftrs.NGramsOfWords(1),
			normalizer: ftrs.RegexpNormalizer([
			                               			{source: "er\\b", target: ""},
			                            			{source: "est\\b", target: ""},
			                            			{source: " es\\b", target: "es"},
			                           				])
		});

		spamClassifier.trainBatch([
			{input: "cheaper watches", output: [1]},
			{input: "", output: [0]},
		]);
	
		spamClassifier.classify("cheaper watches").should.be.above(0.8);  // high number (spam)
		spamClassifier.classify("cheapest watch es").should.be.above(0.8);  // low number (not spam)
		spamClassifier.classify("cheapless clocks").should.be.below(0.2);  // low number (not spam)

	})
})

describe('classifier with an array of normalizers', function() {
	it('classifies sentences correctly', function() {
		var spamClassifier = new classifiers.EnhancedClassifier({
			classifierType:   classifiers.NeuralNetwork,
			featureExtractor: ftrs.NGramsOfWords(1),
			normalizer: [ftrs.LowerCaseNormalizer,
			             ftrs.RegexpNormalizer([{source: "er\\b", target: ""}]),
			             ftrs.RegexpNormalizer([{source: "est\\b", target: ""}]),
			             ftrs.RegexpNormalizer([{source: " es\\b", target: "es"}])]
		});

		spamClassifier.trainBatch([
			{input: "ChEaPeR WaTcHeS", output: [1]},
			{input: "", output: [0]},
		]);

		spamClassifier.classify("cheaper watches").should.be.above(0.8);  // high number (spam)
		spamClassifier.classify("cheapest watch es").should.be.above(0.8);  // high number (spam)
		spamClassifier.classify("cheapless clocks").should.be.below(0.2);  // low number (not spam)
	})
})
