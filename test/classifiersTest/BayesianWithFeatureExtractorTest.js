/**
 * a unit-test for Enhanced Classifier
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

var should = require('should');
var classifiers = require('../../classifiers');
var ftrs = require('../../features');

var UnigramBayesianClassifier = classifiers.EnhancedClassifier.bind(this, {
	classifierType:   classifiers.Bayesian.bind(this, {
		globalThreshold:  1.5
	}),
	featureExtractor: ftrs.NGramsOfWords(1),
});

describe.skip('bayesian classifier with a single feature extractor for words', function() {
	var spamClassifier = new UnigramBayesianClassifier();

	spamClassifier.trainBatch([
		{input: "cheap replica watch es", output: 'spam'},
		{input: "your watch is ready", output: 'nospam'},
		{input: "I don't know if this works on windows", output: 'nospam'},
		{input: "cheap windows !!!", output: 'spam'},
	]);
	
	it('classifies sentences', function() {
		spamClassifier.classify("cheap clocks !!!").should.equal('spam')
		spamClassifier.classify("I don't know if this is a replica of windows").should.equal('nospam');
		spamClassifier.classify("replica").should.equal('spam');
		spamClassifier.classify("your").should.equal('nospam');
		spamClassifier.classify("watch").should.equal('unclassified');
	})
	
	it('explains its decisions', function() {
		var c;
		c = spamClassifier.classify("cheap clocks !!!",1);
		c.should.have.property('classes', 'spam');
		c.should.have.property('explanation');
		
		c = spamClassifier.classify("I don't know if this is a replica of windows",1);
		c.should.have.property('classes', 'nospam');
		c.should.have.property('explanation');
		
		c = spamClassifier.classify("replica",1);
		c.should.have.property('classes', 'spam');
		c.should.have.property('explanation');
		
		c = spamClassifier.classify("your",1);
		c.should.have.property('classes', 'nospam');
		c.should.have.property('explanation');
		
		c = spamClassifier.classify("watch",1);
		c.should.have.property('classes', 'unclassified');
		c.should.have.property('explanation');
	})
	
	it.skip('supports continuous output', function() {
		spamClassifier.classify("I don't know if this is a replica of windows",0,true).should.be.above(0);
		spamClassifier.classify("replica",0,true).should.be.above(0);
		spamClassifier.classify("your",0,true).should.be.below(0);
		spamClassifier.classify("watch",1).should.be.below(0);
	});
})

describe.skip('another bayesian classifier', function() {
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
