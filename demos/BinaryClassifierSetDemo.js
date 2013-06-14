/**
 * Demonstrates combining several binary classifiers to produce a multi-class classifier.cross-validation testing of a classifier.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

var util = require('util');
var BinaryClassifierSet = require('../BinaryClassifierSet');
var datasets = require('../datasets');

console.log("BinaryClassifierSet demo start");


var dataset = datasets.read("../datasets/Dataset1Woz.txt");
var numOfFolds = 10; // for 10-fold cross-validation

//var binaryClassifierType = require('../classifier').Bayesian; 
var binaryClassifierType = require('../brain').NeuralNetwork; 

var bcs = new BinaryClassifierSet(binaryClassifierType, {}, {});

bcs.addClasses(['spam', 'clocks', 'windows', 'important', 'pills'])
bcs.train("cheap replica watch es", ['spam', 'clocks']);
bcs.train("your watch is ready", ['clocks', 'important']);
bcs.train("I don't know if this works on windows", ['windows', 'important']);
bcs.train("cheap windows !!!", ['windows', 'spam']);
bcs.train("get this for cheap !!!", ['spam']);

//console.log(JSON.stringify(bcs.toJSON()));

var newDocument = "cheap clocks !!!";
var classes = bcs.classify(newDocument); 
console.log("'"+newDocument+"' is "+classes);  

console.log("BinaryClassifierSet demo end");
