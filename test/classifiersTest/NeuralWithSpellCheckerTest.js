/**
 * a unit-test for Enhanced Classifier
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

var should = require('should');
var classifiers = require('../../classifiers');
var ftrs = require('../../features');

try {
	var wordsworth = require('wordsworth');
	var isTestRelevant = true;
} catch (e) {
	var isTestRelevant = false;
}

describe('baseline - classifier without a spell-checker', function() {
	it('errs on sentences with spelling mistakes', function() {
		var spamClassifier = new classifiers.EnhancedClassifier({
			classifierType:   classifiers.NeuralNetwork,
			featureExtractor: ftrs.NGramsOfWords(1),
			spellChecker: null,
		});

		spamClassifier.trainBatch([
			{input: "cheap watches", output: [1]},
			{input: "", output: [0]},
		]);

		spamClassifier.classify("cheap watches").should.be.above(0.6);  // (spam)
		spamClassifier.classify("cheep watchs").should.be.below(0.4);  // (not spam)
		spamClassifier.classify("expensive clocks").should.be.below(0.4);  // (not spam)
	})
})

describe('classifier with spell-checker', function() {
	it('classifies sentences with spelling mistakes correctly', isTestRelevant? function() {
		var spamClassifier = new classifiers.EnhancedClassifier({
			classifierType:   classifiers.NeuralNetwork,
			featureExtractor: ftrs.NGramsOfWords(1),
			spellChecker: wordsworth.getInstance(),
		});

		spamClassifier.trainBatch([
			{input: "cheap watches", output: [1]},
			{input: "", output: [0]},
		]);

		spamClassifier.classify("cheap watches").should.be.above(0.9);  // (spam)
		spamClassifier.classify("cheep watchs").should.be.above(0.9);  // (not spam)
		spamClassifier.classify("expensive clocks").should.be.below(0.4);  // (not spam)
	}: null)
});
