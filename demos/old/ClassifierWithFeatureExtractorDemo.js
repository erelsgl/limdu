/**
 * Demonstrates wrapping a classifier with a feature extractor.
 *
 * Neural network classifier.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

console.log("ClassifierWithFeatureExtractor demo start");

var classifiers = require('../classifiers');


var spamClassifier = new classifiers.EnhancedClassifier({
	classifierType:   classifiers.NeuralNetwork,
	featureExtractor: require('../features').WordsFromText(1)
});
spamClassifier.trainBatch([
	{input: "cheap replica watch es", output: [1]},
	{input: "your watch is ready", output: [0]},
	{input: "I don't know if this works on windows", output: [0]},
	{input: "cheap windows !!!", output: [1]},
	//{input: "get this for cheap !!!", output: [1]},
]);

//console.log(JSON.stringify(bcs.toJSON()));

var toPercent = function(n) { 
	return Math.round(n*100)+"% spam"; 
}

var newDocument = "cheap clocks !!!";
console.log("'"+newDocument+"' is "+toPercent(spamClassifier.classify(newDocument)));  // very high number (spam)
newDocument = "I don't know if this is a replica of windows";
console.log("'"+newDocument+"' is "+toPercent(spamClassifier.classify(newDocument)));  // low number (not spam)
newDocument = "replica";
console.log("'"+newDocument+"' is "+toPercent(spamClassifier.classify(newDocument)));  // high number (probably spam)
newDocument = "your";
console.log("'"+newDocument+"' is "+toPercent(spamClassifier.classify(newDocument)));  // low number (not spam)
newDocument = "watch";
console.log("'"+newDocument+"' is "+toPercent(spamClassifier.classify(newDocument)));  // medium number (not sure if spam)

console.log("ClassifierWithFeatureExtractor demo end");
