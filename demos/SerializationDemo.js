/**
 * Demonstrates training a classifier and then serializing it.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

var util = require('util'),
	serialize = require('../utils/serialize'),
	fs = require('fs')
	;

console.log("serialization demo start");
var createNewClassifier = function() {
	var classifiers = require(__dirname+'/../classifiers');
	return new classifiers.BinaryClassifierSet({
		binaryClassifierType: classifiers.Bayesian,
	});
}

var classifier = createNewClassifier();
classifier.addClasses(['spam', 'clocks', 'windows', 'important', 'pills']);
classifier.trainOnline("cheap replica watch es", ['spam', 'clocks']);
classifier.trainOnline("your watch is ready", ['clocks', 'important']);
classifier.trainOnline("I don't know if this works on windows", ['windows', 'important']);
classifier.trainOnline("cheap windows !!!", ['windows', 'spam']);
classifier.trainOnline("get this for cheap !!!", ['spam']);

console.log("\nORIGINAL TRAINED CLASSIFIER: ");
var newDocument = "cheap clocks !!!";
console.log("'"+newDocument+"' is "+classifier.classify(newDocument));  
newDocument = "I don't know if this is a replica of windows";
console.log("'"+newDocument+"' is "+classifier.classify(newDocument));  

fs.writeFileSync("serializations/SerializationDemo.json", 
	serialize.toString(classifier, createNewClassifier), 'utf8');

console.log("\nDESERIALIZED CLASSIFIER: ");
var classifier2 = serialize.fromString(
	fs.readFileSync("serializations/SerializationDemo.json"), __dirname);

var newDocument = "cheap clocks !!!";
console.log("'"+newDocument+"' is "+classifier2.classify(newDocument));  
newDocument = "I don't know if this is a replica of windows";
console.log("'"+newDocument+"' is "+classifier2.classify(newDocument));  

// re-serialize:
fs.writeFileSync("serializations/SerializationDemo2.json", 
	serialize.toString(classifier2), 'utf8');

console.log("\nDE-RE-SERIALIZED CLASSIFIER: ");
var classifier3 = serialize.fromString(
	fs.readFileSync("serializations/SerializationDemo2.json"), __dirname);

var newDocument = "cheap clocks !!!";
console.log("'"+newDocument+"' is "+classifier3.classify(newDocument));  
newDocument = "I don't know if this is a replica of windows";
console.log("'"+newDocument+"' is "+classifier3.classify(newDocument));  

console.log("\nserialization demo end");
