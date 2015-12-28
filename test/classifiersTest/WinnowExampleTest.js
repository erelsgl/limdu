var should = require('should');
var limdu = require('../../index');

// First, define our base classifier type (a multi-label classifier based on winnow):
var TextClassifier = limdu.classifiers.multilabel.BinaryRelevance.bind(0, {
	binaryClassifierType: limdu.classifiers.Winnow.bind(0, {retrain_count: 10})
});

// Define a feature extractor (a function that takes a sample and add features to a given features set):
var WordExtractor = function(input, features) {
	input.split(" ").forEach(function(word) {
		features[word]=1;
	});
};

describe('winnow classifier', function() {
	it('works with a feature-extractor', function() {
        // Initialize a classifier with a feature extractor:
        var intentClassifier = new limdu.classifiers.EnhancedClassifier({
            classifierType: TextClassifier,
            featureExtractor: WordExtractor
        });

        // Train and test:
        intentClassifier.trainBatch([
            {input: "I want an apple", output: "apl"},
            {input: "I want a banana", output: "bnn"},
            {input: "I want chips", output: "cps"},
            ]);
        intentClassifier.classify("I want an apple and a banana").sort().should.eql(['apl','bnn']);
        intentClassifier.classify("I WANT AN APPLE AND A BANANA").sort().should.eql([]);  // case sensitive
	})
})

describe('winnow classifier', function() {
	it('works with a case-normalizer', function() {

        //Initialize a classifier with a feature extractor and a case normalizer:
        intentClassifier = new limdu.classifiers.EnhancedClassifier({
            classifierType: TextClassifier,
            normalizer: limdu.features.LowerCaseNormalizer,
            featureExtractor: WordExtractor
        });

        //Train and test:
        intentClassifier.trainBatch([
            {input: "I want an apple", output: "apl"},
            {input: "I want a banana", output: "bnn"},
            {input: "I want chips", output: "cps"},
            ]);

        intentClassifier.classify("I want an apple and a banana").sort().should.eql(['apl','bnn']);
        intentClassifier.classify("I WANT AN APPLE AND A BANANA").sort().should.eql(['apl','bnn']); // case insensitive
    })
})
