/**
 * Demonstrates a binary classifier set - combining several binary classifiers to produce a multi-class classifier.cross-validation testing of a classifier.
 * Bayesian classifier, online training.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

console.log("BinaryClassifierSet online-learning demo start");

var classifiers = require('../classifiers');

var bcs = new classifiers.BinaryClassifierSet({
	'binaryClassifierType': classifiers.Bayesian
});

bcs.addClasses(['spam', 'clocks', 'windows', 'important', 'pills'])
bcs.trainOnline("cheap replica watch es", ['spam', 'clocks']);
bcs.trainOnline("your watch is ready", ['clocks', 'important']);
bcs.trainOnline("I don't know if this works on windows", ['windows', 'important']);
bcs.trainOnline("cheap windows !!!", ['windows', 'spam']);
bcs.trainOnline("get this for cheap !!!", ['spam']);

var newDocument = "cheap clocks !!!";
console.log("'"+newDocument+"' is "+bcs.classify(newDocument));  
newDocument = "I don't know if this is a replica of windows";
console.log("'"+newDocument+"' is "+bcs.classify(newDocument));  

console.log("BinaryClassifierSet online-learning demo end");
