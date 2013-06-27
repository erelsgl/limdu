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
classifier.train("cheap replica watch es", ['spam', 'clocks']);
classifier.train("your watch is ready", ['clocks', 'important']);
classifier.train("I don't know if this works on windows", ['windows', 'important']);
classifier.train("cheap windows !!!", ['windows', 'spam']);
classifier.train("get this for cheap !!!", ['spam']);

console.log("\nORIGINAL TRAINED CLASSIFIER: ");
//console.dir(classifier);
var newDocument = "cheap clocks !!!";
console.log("'"+newDocument+"' is "+classifier.classify(newDocument));  
newDocument = "I don't know if this is a replica of windows";
console.log("'"+newDocument+"' is "+classifier.classify(newDocument));  

serialize.saveSync(createNewClassifier, __dirname, classifier, 
	"serializations/SerializationDemo.json");

console.log("\nDESERIALIZED CLASSIFIER: ");
var classifier2 = serialize.loadSync(
	"serializations/SerializationDemo.json");
//console.dir(classifier2);
var newDocument = "cheap clocks !!!";
console.log("'"+newDocument+"' is "+classifier2.classify(newDocument));  
newDocument = "I don't know if this is a replica of windows";
console.log("'"+newDocument+"' is "+classifier2.classify(newDocument));  

console.log("\nserialization demo end");
