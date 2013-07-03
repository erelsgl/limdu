/**
 * Demonstrates wrapping a classifier with a feature extractor.
 *
 * Neural network classifier.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

var util = require('util');
var EnhancedClassifier = require('../EnhancedClassifier');

console.log("ClassifierWithFeatureExtractor demo start");

var spamClassifier = new EnhancedClassifier({
	classifierType:   require('../brain').NeuralNetwork,
	featureExtractor: require('../FeatureExtractor').WordsFromText(1)
});
spamClassifier.trainBatch([
	{input: "cheap replica watch es", output: [1]},
	{input: "your watch is ready", output: [0]},
	{input: "I don't know if this works on windows", output: [0]},
	{input: "cheap windows !!!", output: [1]},
	//{input: "get this for cheap !!!", output: [1]},
]);

//console.log(JSON.stringify(bcs.toJSON()));

var newDocument = "cheap clocks !!!";
console.log("'"+newDocument+"' is "+spamClassifier.classify(newDocument));  // very high number (spam)
newDocument = "I don't know if this is a replica of windows";
console.log("'"+newDocument+"' is "+spamClassifier.classify(newDocument));  // low number (not spam)
newDocument = "replica";
console.log("'"+newDocument+"' is "+spamClassifier.classify(newDocument));  // high number (probably spam)
newDocument = "your";
console.log("'"+newDocument+"' is "+spamClassifier.classify(newDocument));  // low number (not spam)
newDocument = "watch";
console.log("'"+newDocument+"' is "+spamClassifier.classify(newDocument));  // medium number (not sure if spam)

console.log("ClassifierWithFeatureExtractor demo end");
