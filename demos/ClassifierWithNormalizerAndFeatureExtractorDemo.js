/**
 * Demonstrates wrapping a classifier with sample normalizer and feature extractor
 *
 * Neural network classifier.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

console.log("ClassifierWithNormalizerAndFeatureExtractor demo start");

var classifiers = require('../classifiers');
var features = require('../features');


var spamClassifier = new classifiers.EnhancedClassifier({
	classifierType:   classifiers.NeuralNetwork,
	normalizer: features.RegexpNormalizer([
		{source: "\\b(...+)est\\b", target: "$1"},
		{source: "\\b(...+)er\\b", target: "$1"},
	]),
	featureExtractor: features.WordsFromText(1)
});
spamClassifier.trainBatch([
	{input: "cheaper replica watch es", output: [1]},
	{input: "your watch is ready", output: [0]},
	//{input: "get this for cheap !!!", output: [1]},
]);

//console.log(JSON.stringify(bcs.toJSON()));

var toPercent = function(n) { 
	return Math.round(n*100)+"% spam"; 
}

var newDocument = "cheap";
console.log("'"+newDocument+"' is "+toPercent(spamClassifier.classify(newDocument)));  // very high number (spam)
var newDocument = "cheaper";
console.log("'"+newDocument+"' is "+toPercent(spamClassifier.classify(newDocument)));  // very high number (spam)
var newDocument = "cheapest";
console.log("'"+newDocument+"' is "+toPercent(spamClassifier.classify(newDocument)));  // very high number (spam)
var newDocument = "cheapless";
console.log("'"+newDocument+"' is "+toPercent(spamClassifier.classify(newDocument)));  // very high number (spam)

console.log("ClassifierWithNormalizerAndFeatureExtractor demo end");
