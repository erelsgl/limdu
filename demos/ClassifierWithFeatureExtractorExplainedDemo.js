/**
 * Demonstrates wrapping a classifier with a feature extractor.
 *
 * Winnow classifier, with explanations.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-07
 */

var util = require('util');
var EnhancedClassifier = require('../EnhancedClassifier');

console.log("ClassifierWithFeatureExtractorExplained demo start");

var spamClassifier = new EnhancedClassifier({
	classifierType:   require('../winnow/winnow_hash'),
	featureExtractor: require('../FeatureExtractor').WordsFromText(1)
});
spamClassifier.trainBatch([
	{input: "cheap replica watch es", output: 1},
	{input: "your watch is ready", output: 0},
	{input: "I don't know if this works on windows", output: 0},
	{input: "cheap windows !!!", output: 1},
	//{input: "get this for cheap !!!", output: 1},
]);

var explain = 3;

var stringify = function(a) {
	return JSON.stringify(a, function(key, val) {
		return val.toPrecision? Number(val.toPrecision(3)) : val;
	})
}

var newDocument = "cheap clocks !!!";
console.log("'"+newDocument+"' is "+stringify(spamClassifier.classify(newDocument, explain)));  // very high number (spam)
newDocument = "I don't know if this is a replica of windows";
console.log("'"+newDocument+"' is "+stringify(spamClassifier.classify(newDocument, explain)));  // low number (not spam)
newDocument = "replica";
console.log("'"+newDocument+"' is "+stringify(spamClassifier.classify(newDocument, explain)));  // high number (probably spam)
newDocument = "your";
console.log("'"+newDocument+"' is "+stringify(spamClassifier.classify(newDocument, explain)));  // low number (not spam)
newDocument = "your car is ready";
console.log("'"+newDocument+"' is "+stringify(spamClassifier.classify(newDocument, explain)));  // low number (not spam)
newDocument = "watch";
console.log("'"+newDocument+"' is "+stringify(spamClassifier.classify(newDocument, explain)));  // medium number (not sure if spam)

console.log("ClassifierWithFeatureExtractorExplained demo end");
