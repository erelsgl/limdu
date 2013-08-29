/**
 * Demonstrates multi label classification - zero or more classes per sample
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */


console.log("Multi-Label Classification demo start");

var classifiers = require('../classifiers');
var mlutils = require('../utils');
var fs = require('fs');
var _ = require('underscore')._;

var PassiveAggressiveClassifier = classifiers.multilabel.PassiveAggressive.bind(this, {
	Constant: 5.0,
	retrain_count: 10,
});

var BinaryRelevanceClassifier = classifiers.multilabel.BinaryRelevance.bind(this, {
	'binaryClassifierType': classifiers.Winnow.bind(this, {
		promotion: 1.5,
		demotion: 0.5,
		retrain_count: 10,
	}),
});

var HomerClassifier = classifiers.multilabel.Homer.bind(this, {
	multilabelClassifierType: BinaryRelevanceClassifier
});

var classifier = new HomerClassifier();
//var classifier = new BinaryRelevanceClassifier();

var explain=0;
var classes = ['A','B','C','D','E','F','G'];
var extra_features = {me:1, wants:1, the:1, and:1};
//var classes = ['1','2','3','4','5','6','7'];

// Create a training set - one class per sample   
var oneClassPerSample = classes.map(function(theClass) {
	var input = _(extra_features).clone();
	var theFeature = theClass+theClass;
	input[theFeature] = 1;
	var sample = {input: input, output: [theClass]};
	return sample;
});

zeroClassesPerSample = [{input: _(extra_features).clone(), output: []}];

// Create a test set - combinations of zero or more classes per sample
var twoOrMoreClassesPerSample = [];
for (var numClasses=2; numClasses<classes.length; ++numClasses) {
	for (var iFirstClass=0; iFirstClass<(numClasses? classes.length: 1); ++iFirstClass) {
		var input = _(extra_features).clone();
		var output = [];
		for (var iClass=0; iClass<numClasses; ++iClass) {
			var theClass = classes[(iFirstClass+iClass)%classes.length];
			var theFeature = theClass+theClass;
			input[theFeature] = 1;
			output.push(theClass);
		}
		var sample={input:input, output:output};
		twoOrMoreClassesPerSample.push(sample);
	}
}

var explain = 0;
//classifier.trainBatch(oneClassPerSample);
//mlutils.testLite(classifier, oneClassPerSample.concat(twoOrMoreClassesPerSample).concat(zeroClassesPerSample), explain);

classifier.trainBatch(twoOrMoreClassesPerSample.concat(zeroClassesPerSample));
mlutils.testLite(classifier, oneClassPerSample, explain);

console.log("Multi-Label Classification demo end");

