/**
 * Demonstrates batch training of a binary classifier set - combining several binary classifiers to produce a multi-class classifier.cross-validation testing of a classifier.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

var util = require('util');
var BinaryClassifierSet = require('../BinaryClassifierSet');

console.log("BinaryClassifierSet demo start");

var binaryClassifierType = require('../classifier').Bayesian; 

var bcs = new BinaryClassifierSet(binaryClassifierType, {}, {});

bcs.addClasses(['spam', 'clocks', 'windows', 'important', 'pills'])
bcs.train("cheap replica watch es", ['spam', 'clocks']);
bcs.train("your watch is ready", ['clocks', 'important']);
bcs.train("I don't know if this works on windows", ['windows', 'important']);
bcs.train("cheap windows !!!", ['windows', 'spam']);
bcs.train("get this for cheap !!!", ['spam']);

//console.log(JSON.stringify(bcs.toJSON()));

var newDocument = "cheap clocks !!!";
console.log("'"+newDocument+"' is "+bcs.classify(newDocument));  
newDocument = "I don't know if this is a replica of windows";
console.log("'"+newDocument+"' is "+bcs.classify(newDocument));  

console.log("BinaryClassifierSet demo end");
