/**
 * Demonstrates a binary classifier set with a feature extractor.
 * A perceptron, online training.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

var util = require('util');
var BinaryClassifierSet = require('../BinaryClassifierSet');
var ClassifierWithFeatureExtractor = require('../ClassifierWithFeatureExtractor');

console.log("BinaryClassifierSet with feature extractor demo start");

var bcs = new BinaryClassifierSet({
	binaryClassifierType: require('../ClassifierWithFeatureExtractor'),
	binaryClassifierOptions: {
		classifierType:   require('../perceptron/perceptron_hash'),
		featureExtractor: require('../FeatureExtractor').WordsFromText(1)
	}
});

bcs.trainOnline("cheap replica watch es", ['spam', 'clocks']);
bcs.trainOnline("your watch is ready", ['clocks', 'important']);
bcs.trainOnline("I don't know if this works on windows", ['windows', 'important']);
bcs.trainOnline("cheap windows !!!", ['windows', 'spam']);
bcs.trainOnline("get this for cheap !!!", ['spam']);
bcs.trainOnline("an opportunity !!!", ['spam']);

//console.dir(bcs);

var newDocument = "cheap clocks !!!";
console.log("'"+newDocument+"' is "+bcs.classify(newDocument));  
newDocument = "I don't know if this is a replica of windows";
console.log("'"+newDocument+"' is "+bcs.classify(newDocument));  

console.log("BinaryClassifierSet with feature extractor demo end");
