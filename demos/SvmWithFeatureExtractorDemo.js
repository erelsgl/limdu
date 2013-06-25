/**
 * Demonstrates using an SVM (from the svmjs package) wrapped with a feature extractor and a feature lookup table.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

var WordsFromText = require('../FeatureExtractor/WordExtractor').WordsFromText;
var LettersFromText = require('../FeatureExtractor/LetterExtractor').LettersFromText;
var CollectionOfExtractors = require('../FeatureExtractor/CollectionOfExtractors').CollectionOfExtractors;
var FeatureLookupTable = require('../FeatureExtractor/FeatureLookupTable');
var ClassifierWithFeatureExtractor = require('../ClassifierWithFeatureExtractor');
var SVM = require('../svmjs').SVM;

console.log("SVM with feature extractor demo start");

var classifier = new ClassifierWithFeatureExtractor({
	classifierType:   SVM,
	classifierOptions: {
		C: 1.0,
	},
	featureExtractor: CollectionOfExtractors([
	    WordsFromText(1),
	    WordsFromText(2),
	    //LettersFromText(2), 
	    LettersFromText(3),
	]),
	featureLookupTable: new FeatureLookupTable(),
});

classifier.trainAll([
	{input: "cheap replica watches", output: 1},
	{input: "cheap store", output: -1},
]);
console.dir(classifier.featureLookupTable);

console.dir(classifier.classify("cheap replica watches"));
console.dir(classifier.classify("watches in replica"));
console.dir(classifier.classify("store for replica watches"));
console.dir(classifier.classify("store for everything you need"));

console.log("SVM with feature extractor demo end");
