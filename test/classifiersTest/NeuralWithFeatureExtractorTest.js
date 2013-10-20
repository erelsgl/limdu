/**
 * a unit-test for Enhanced Classifier
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

var should = require('should');
var classifiers = require('../../classifiers');
var ftrs = require('../../features');

describe('classifier with a single feature extractor for words', function() {
	it('classifies sentences', function() {
		var spamClassifier = new classifiers.EnhancedClassifier({
			classifierType:   classifiers.NeuralNetwork,
			featureExtractor: ftrs.NGramsOfWords(1)
		});
		
		spamClassifier.trainBatch([
			{input: "cheap replica watch es", output: [1]},
			{input: "your watch is ready", output: [0]},
			{input: "I don't know if this works on windows", output: [0]},
			{input: "cheap windows !!!", output: [1]},
		]);

		spamClassifier.classify("cheap clocks !!!").should.be.above(0.8);  // very high number (spam)
		spamClassifier.classify("I don't know if this is a replica of windows").should.be.below(0.2);  // low number (not spam)
		spamClassifier.classify("replica").should.be.above(0.5);  // high number (probably spam)
		spamClassifier.classify("your").should.be.below(0.5);  // low number (not spam)
		spamClassifier.classify("watch").should.be.above(0.3).and.below(0.7);  // medium number (not sure if spam)
	})
})

describe('classifier with an array of feature extractors, for words and bigrams', function() {
	it('classifies sentences', function() {
		var spamClassifier = new classifiers.EnhancedClassifier({
			classifierType:   classifiers.NeuralNetwork,
			featureExtractor: [ftrs.NGramsOfWords(1),ftrs.NGramsOfWords(2)]
		});
		
		spamClassifier.trainBatch([
			{input: "cheap replica watch es", output: [1]},
			{input: "your watch is ready", output: [0]},
			{input: "I don't know if this works on windows", output: [0]},
			{input: "cheap windows !!!", output: [1]},
		]);

		spamClassifier.classify("cheap clocks !!!").should.be.above(0.8);  // very high number (spam)
		spamClassifier.classify("I don't know if this is a replica of windows").should.be.below(0.2);  // low number (not spam)
		spamClassifier.classify("replica").should.be.above(0.5);  // high number (probably spam)
		spamClassifier.classify("your").should.be.below(0.5);  // low number (not spam)
		spamClassifier.classify("watch").should.be.above(0.3).and.below(0.7);  // medium number (not sure if spam)
	})
})
