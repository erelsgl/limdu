/**
 * Demonstrates using an SVM (from the svmjs package) wrapped with a feature extractor and a feature lookup table.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

console.log("SVM with feature extractor demo start");

var FeaturesUnit = require('../features');
var classifiers = require('../classifiers');
var serialize = require('../utils/serialize');


var classifier = new classifiers.EnhancedClassifier({
	classifierType:   classifiers.SVM,
	classifierOptions: {
		C: 1.0,
	},
	featureExtractor: [
	    FeaturesUnit.WordsFromText(1),
	    FeaturesUnit.WordsFromText(2),
	    FeaturesUnit.LettersFromText(3),
	],
	featureLookupTable: new FeaturesUnit.FeatureLookupTable(),
});

classifier.trainBatch([
	{input: "cheap replica watches", output: 1},
	{input: "cheap store", output: 0},
]);

console.dir(classifier.classify("watches in replica"));
console.dir(classifier.classify("store for replica watches"));
console.dir(classifier.classify("store for everything you need"));

console.log("SVM with feature extractor demo end");
