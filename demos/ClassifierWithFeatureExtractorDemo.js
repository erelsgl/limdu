/**
 * Demonstrates wrapping a classifier with a feature extractor
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

var util = require('util');
var ClassifierWithFeatureExtractor = require('../ClassifierWithFeatureExtractor');

console.log("ClassifierWithFeatureExtractor demo start");

var cwfe = new ClassifierWithFeatureExtractor({
	classifierType:   require('../brain').NeuralNetwork,
	featureExtractor: require('../FeatureExtractor/WordExtractor').WordsFromText(1)
});
cwfe.trainBatch([
	{input: "cheap replica watch es", output: [1]},
	{input: "your watch is ready", output: [0]},
	{input: "I don't know if this works on windows", output: [0]},
	{input: "cheap windows !!!", output: [1]},
	//{input: "get this for cheap !!!", output: [1]},
]);

//console.log(JSON.stringify(bcs.toJSON()));

var newDocument = "cheap clocks !!!";
console.log("'"+newDocument+"' is "+cwfe.classify(newDocument));  // very high number (spam)
newDocument = "I don't know if this is a replica of windows";
console.log("'"+newDocument+"' is "+cwfe.classify(newDocument));  // low number (not spam)
newDocument = "replica";
console.log("'"+newDocument+"' is "+cwfe.classify(newDocument));  // high number (probably spam)
newDocument = "your";
console.log("'"+newDocument+"' is "+cwfe.classify(newDocument));  // low number (not spam)
newDocument = "watch";
console.log("'"+newDocument+"' is "+cwfe.classify(newDocument));  // medium number (not sure if spam)

console.log("ClassifierWithFeatureExtractor demo end");
