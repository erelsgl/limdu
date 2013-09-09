/**
 * Demonstrates binary classifier set where the classes are objects (and not strings)
 * Bayesian classifier, batch training.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

console.log("BinaryClassifierSet complex classes start");

var classifiers = require('../classifiers');

var bcs = new classifiers.BinaryClassifierSet({
	'binaryClassifierType': classifiers.Bayesian
});
bcs.trainBatch([
	{input: "cheap replica watch es", output: [{'spam':true}, {'clocks':true}]},
	{input: "your watch is ready", output: [{'clocks':true}, 'important']},
	{input: "I don't know if this works on windows", output: ['windows', 'important']},
	{input: "cheap windows !!!", output: ['windows', {'spam':true}]},
	{input: "get this for cheap !!!", output: [{'spam':true}]},
]);

//console.dir(bcs);

var newDocument = "cheap clocks !!!";
console.log("'"+newDocument+"' is "+bcs.classify(newDocument));  
newDocument = "I don't know if this is a replica of windows";
console.log("'"+newDocument+"' is "+bcs.classify(newDocument));  

console.log("BinaryClassifierSet complex classes end");
