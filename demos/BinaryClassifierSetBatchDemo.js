/**
 * Demonstrates binary classifier set - combining several binary classifiers to produce a multi-class classifier.
 * Bayesian classifier, batch training.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

console.log("BinaryClassifierSet batch-learning demo start");

var classifiers = require('../classifiers');

var bcs = new classifiers.BinaryClassifierSet({
	'binaryClassifierType': classifiers.Bayesian
});
bcs.trainBatch([
	{input: "cheap replica watch es", output: ['spam', 'clocks']},
	{input: "your watch is ready", output: ['clocks', 'important']},
	{input: "I don't know if this works on windows", output: ['windows', 'important']},
	{input: "cheap windows !!!", output: ['windows', 'spam']},
	{input: "get this for cheap !!!", output: ['spam']},
]);

var newDocument = "cheap clocks !!!";
console.log("'"+newDocument+"' is "+bcs.classify(newDocument));  
newDocument = "I don't know if this is a replica of windows";
console.log("'"+newDocument+"' is "+bcs.classify(newDocument));  

console.log("BinaryClassifierSet batch-learning demo end");
