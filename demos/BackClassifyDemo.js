/**
 * Demonstrates back-classification (by saving previous training samples).
 * 
 * @author Erel Segal-Halevi
 * @since 2013-07
 */


console.log("BackClassify demo start");

var classifiers = require('../classifiers');

var spamClassifier = new classifiers.EnhancedClassifier({
	classifierType:   classifiers.NeuralNetwork,
	featureExtractor: require('../features').WordsFromText(1),
	pastTrainingSamples: [],
});
spamClassifier.trainBatch([
	{input: "cheap replica watch es", output: [1]},
	{input: "your watch is ready", output: [0]},
	{input: "I don't know if this works on windows", output: [0]},
	{input: "cheap windows !!!", output: [1]},
]);

console.dir(spamClassifier.backClassify([1]));

console.log("BackClassify demo end");
