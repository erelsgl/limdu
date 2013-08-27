/**
 * a unit-test for Enhanced Classifier
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

var should = require('should');
var classifiers = require('../../classifiers');
var FeaturesUnit = require('../../features');

var UnigramBayesianClassifier = classifiers.EnhancedClassifier.bind(this, {
	classifierType:   classifiers.Bayesian.bind(this, {
		globalThreshold:  1.5
	}),
	featureExtractor: FeaturesUnit.WordsFromText(1),
});

describe('bayesian classifier with a single feature extractor for words', function() {
	it('classifies sentences', function() {
		var spamClassifier = new UnigramBayesianClassifier();

		spamClassifier.trainBatch([
			{input: "cheap replica watch es", output: 'spam'},
			{input: "your watch is ready", output: 'nospam'},
			{input: "I don't know if this works on windows", output: 'nospam'},
			{input: "cheap windows !!!", output: 'spam'},
		]);
		var c;
		c = spamClassifier.classify("cheap clocks !!!",1);
		//console.dir(c);
		c.should.have.property('category', 'spam');
		c.should.have.property('probability').above(0);
		c = spamClassifier.classify("I don't know if this is a replica of windows",1);
		//console.dir(c);
		c.should.have.property('category', 'nospam');
		c.should.have.property('probability').above(0);
		c = spamClassifier.classify("replica",1);
		//console.dir(c);
		c.should.have.property('category', 'spam');
		c.should.have.property('probability').above(0);
		c = spamClassifier.classify("your",1);
		//console.dir(c);
		c.should.have.property('category', 'nospam');
		c.should.have.property('probability').above(0);
		c = spamClassifier.classify("watch",1);
		//console.dir(c);
		c.should.have.property('category', 'unclassified');
		c.should.have.property('probability').above(0);
	})
})

describe('another bayesian classifier', function() {
	it('classifies sentences', function() {
		var classifier = new UnigramBayesianClassifier();

		classifier.trainBatch([
			{input: "I want aa", output: 'a'},
			{input: "I want bb", output: 'b'},
			{input: "I want cc", output: 'c'},
		]);
		classifier.classify("I want aa").should.equal('a');
		classifier.classify("I want bb").should.equal('b');
		classifier.classify("I want cc").should.equal('c');
		classifier.classify("I want aa bb").should.equal('unclassified');
		classifier.classify("I want aa cc").should.equal('unclassified');
		classifier.classify("I want bb cc").should.equal('unclassified');
		classifier.classify("I want aa bb cc").should.equal('unclassified');
	})
})
