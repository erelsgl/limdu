/**
 * Demonstrates a binary classifier set with a feature extractor.
 * A neural network, batch training.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

var util = require('util');
var BinaryClassifierSet = require('../BinaryClassifierSet');
var ClassifierWithFeatureExtractor = require('../ClassifierWithFeatureExtractor');

console.log("BinaryClassifierSet with feature extractor demo start");

var bcs = new BinaryClassifierSet({
	binaryClassifierType: require('../ClassifierWithFeatureExtractor'),
	binaryClassifierOptions: {
		classifierType:   require('../brain').NeuralNetwork,
		//classifierType:   require('../perceptron/perceptron_hash'),
		featureExtractor: require('../FeatureExtractor').WordsFromText(1)
	}
});
bcs.trainBatch([
	{input: "cheap replica watch es", output: ['spam', 'clocks']},
	{input: "your watch is ready", output: ['clocks', 'important']},
	{input: "I don't know if this works on windows", output: ['windows', 'important']},
	{input: "cheap windows !!!", output: ['windows', 'spam']},
	{input: "get this for cheap !!!", output: ['spam']},
	{input: "an opportunity !!!", output: ['spam']},
]);

//console.dir(bcs);

var newDocument = "cheap clocks !!!";
console.log("'"+newDocument+"' is "+bcs.classify(newDocument));  
newDocument = "I don't know if this is a replica of windows";
console.log("'"+newDocument+"' is "+bcs.classify(newDocument));  

console.log("BinaryClassifierSet with feature extractor demo end");
