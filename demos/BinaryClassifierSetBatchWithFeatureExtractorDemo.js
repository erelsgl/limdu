/**
 * Demonstrates a binary classifier set with a feature extractor.
 * Neural network, batch training.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */
 
console.log("BinaryClassifierSet with feature extractor batch demo start");

var classifiers = require('../classifiers');

var bcs = new classifiers.BinaryClassifierSet({
	binaryClassifierType: classifiers.EnhancedClassifier,
	binaryClassifierOptions: {
		classifierType:   classifiers.NeuralNetwork,
		featureExtractor: require('../features').WordsFromText(1)
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

console.log("BinaryClassifierSet with feature extractor batch demo end");
