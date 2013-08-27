/**
 * Demonstrates a binary classifier set with a feature extractor.
 * perceptron or winnow, online training.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

console.log("multilabel.BinaryRelevance with feature extractor demo start");

var classifiers = require('../classifiers');

var bcs = new classifiers.multilabel.BinaryRelevance({
	binaryClassifierType: classifiers.EnhancedClassifier.bind(this, {
		classifierType:   classifiers.Winnow,
		featureExtractor: require('../features').WordsFromText(1)
	})
});

bcs.trainOnline("cheap replica watch es", ['spam', 'clocks']);
bcs.trainOnline("your watch is ready", ['clocks', 'important']);
bcs.trainOnline("I don't know if this works on windows", ['windows', 'important']);
bcs.trainOnline("cheap windows !!!", ['windows', 'spam']);
bcs.trainOnline("get this for cheap !!!", ['spam']);
bcs.trainOnline("an opportunity !!!", ['spam']);

var explain=4;

var stringify = function(a) {
	return JSON.stringify(a, function(key, val) {
		return val&&val.toPrecision? Number(val.toPrecision(3)) : val;
	})
}

var newDocument = "cheap clocks !!!";
console.log("'"+newDocument+"' is "+stringify(bcs.classify(newDocument, explain)));  
newDocument = "I don't know if this is a replica of windows";
console.log("'"+newDocument+"' is "+stringify(bcs.classify(newDocument, explain)));  

console.log("multilabel.BinaryRelevance with feature extractor demo end");
