var util = require('util');
console.log("BinaryClassifierSet demo start");

var classifier = require('../classifier');
var BinaryClassifierSet = require('../BinaryClassifierSet');

var bcs = new BinaryClassifierSet(classifier.Bayesian, {}, {});

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
