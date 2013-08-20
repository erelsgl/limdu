/**
 * Demonstrates multi label classification with BinarySegmentation algorithm
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */


console.log("Multi-Label Classification demo start");

var classifiers = require('../classifiers');
var mlutils = require('../utils');
var FeaturesUnit = require('../features');
var fs = require('fs');
var _ = require('underscore')._;

var classifier = new classifiers.multilabel.BinarySegmentation({
	binaryClassifierType: classifiers.Winnow,
	binaryClassifierOptions: {
		promotion: 1.5,
		demotion: 0.5,
		retrain_count: 10,
	},
	featureExtractor: FeaturesUnit.WordsFromText(1)
});

var explain=0;
var classes = ['A','B','C','D','E','F','G'];
var extra_features = {me:1, wants:1, the:1, and:1};

// Create a training set - one class per sample   
var trainSet = classes.map(function(theClass) {
	var input = Object.keys(extra_features).join(" ");
	var theFeature = theClass+theClass;
	input += " "+theFeature;
	var sample = {
		input: input, 
		output: [{"Offer":theClass}]};
	return sample;
});

// Create a test set - combinations of zero or more classes per sample
var testSet = [];
for (var numClasses=0; numClasses<classes.length; ++numClasses) {
	for (var iFirstClass=0; iFirstClass<(numClasses? classes.length: 1); ++iFirstClass) {
		var input = Object.keys(extra_features).join(" ");
		var output = [];
		for (var iClass=0; iClass<numClasses; ++iClass) {
			var theClass = classes[(iFirstClass+iClass)%classes.length];
			var theFeature = theClass+theClass;
			input += " "+theFeature;
			output.push({"Offer":theClass});
		}
		var sample={input:input, output:output};
		testSet.push(sample);
	}
}

var explain = classes.length;
classifier.trainBatch(trainSet);
mlutils.testLite(classifier, testSet, explain);

console.log("Multi-Label Classification demo end");

