/**
 * Demonstrates training a classifier and then serializing it.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

var util = require('util');
var serialize = require('../serialize');

console.log("serialization demo start");
var createNewClassifier = function() {
	var FeatureExtractor = require('../FeatureExtractor');
	var BinaryClassifierSet = require('../BinaryClassifierSet');
	
	return new BinaryClassifierSet({
		binaryClassifierType: require('../classifier/lib/bayesian').Bayesian,
	});
}

var classifier = createNewClassifier();
classifier.addClasses(['spam', 'clocks', 'windows', 'important', 'pills'])
classifier.trainOnline("cheap replica watch es", ['spam', 'clocks']);
classifier.trainOnline("your watch is ready", ['clocks', 'important']);
classifier.trainOnline("I don't know if this works on windows", ['windows', 'important']);
classifier.trainOnline("cheap windows !!!", ['windows', 'spam']);
classifier.trainOnline("get this for cheap !!!", ['spam']);

console.log("\nORIGINAL TRAINED CLASSIFIER: ");
//console.dir(classifier);
var newDocument = "cheap clocks !!!";
console.log("'"+newDocument+"' is "+classifier.classify(newDocument));  
newDocument = "I don't know if this is a replica of windows";
console.log("'"+newDocument+"' is "+classifier.classify(newDocument));  

serialize.saveSync(createNewClassifier, classifier, 
	"serializations/SerializationDemo.json");

console.log("\nDESERIALIZED CLASSIFIER: ");
var classifier2 = serialize.loadSync(
	"serializations/SerializationDemo.json", __dirname);
//console.dir(classifier2);
var newDocument = "cheap clocks !!!";
console.log("'"+newDocument+"' is "+classifier2.classify(newDocument));  
newDocument = "I don't know if this is a replica of windows";
console.log("'"+newDocument+"' is "+classifier2.classify(newDocument));  

console.log("\nserialization demo end");
