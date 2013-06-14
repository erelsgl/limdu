/**
 * Demonstrates online training of a binary classifier set - combining several binary classifiers to produce a multi-class classifier.cross-validation testing of a classifier.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 * 
 * @note this works only when the base binary classifier allow online learning, for example, a Bayesian classifier.
 */

var util = require('util');
var BinaryClassifierSet = require('../BinaryClassifierSet');

console.log("BinaryClassifierSet demo start");


var binaryClassifierType = require('../classifier').Bayesian; 
//var binaryClassifierType = require('../brain').NeuralNetwork; 

var bcs = new BinaryClassifierSet(binaryClassifierType, {}, {});
bcs.trainAll([
	{input: "cheap replica watch es", output: ['spam', 'clocks']},
	{input: "your watch is ready", output: ['clocks', 'important']},
	{input: "I don't know if this works on windows", output: ['windows', 'important']},
	{input: "cheap windows !!!", output: ['windows', 'spam']},
	{input: "get this for cheap !!!", output: ['spam']},
]);

//console.log(JSON.stringify(bcs.toJSON()));

var newDocument = "cheap clocks !!!";
console.log("'"+newDocument+"' is "+bcs.classify(newDocument));  
newDocument = "I don't know if this is a replica of windows";
console.log("'"+newDocument+"' is "+bcs.classify(newDocument));  

console.log("BinaryClassifierSet demo end");
