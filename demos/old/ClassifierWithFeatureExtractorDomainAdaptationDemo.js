/**
 * Demonstrates wrapping a classifier with two feature extractors - one from training and an additional one for testing, for domain adaptation.
 *
 * Winnow classifier.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-07
 */

console.log("ClassifierWithFeatureExtractor DomainAdaptation demo start");

var classifiers = require('../classifiers');
var FeaturesUnit = require('../features');

var spamClassifier = new classifiers.EnhancedClassifier({
	classifierType:  classifiers.Winnow.bind(this, 	{
		retrain_count: 25,
		do_averaging: false,
		margin: 1,
	}),
	featureExtractor: FeaturesUnit.WordsFromText(1)
});


var toPercent = function(n) { 
	return Math.round(n*100)+"% spam"; 
}

var demo = function() {
	var newDocument = "cheap clocks !!!";
	console.log("'"+newDocument+"' is "+toPercent(spamClassifier.classify(newDocument)));  // very high number (spam)
	newDocument = "I don't know if this is a replica of windows";
	console.log("'"+newDocument+"' is "+toPercent(spamClassifier.classify(newDocument)));  // low number (not spam)
	newDocument = "replica";
	console.log("'"+newDocument+"' is "+toPercent(spamClassifier.classify(newDocument)));  // high number (probably spam)
	newDocument = "your";
	console.log("'"+newDocument+"' is "+toPercent(spamClassifier.classify(newDocument)));  // low number (not spam)
	newDocument = "watch";
	console.log("'"+newDocument+"' is "+toPercent(spamClassifier.classify(newDocument)));  // medium number (not sure if spam)
}


console.log("\nInitial training: ");
spamClassifier.trainBatch([
	{input: "cheap replica watch es", output: 1},
	{input: "your watch is ready", output: 0},
	{input: "I don't know if this works", output: 0},
	{input: "cheap windows !!!", output: 1},
]);
spamClassifier.classifyAndLog("cheap replica");
spamClassifier.classifyAndLog("inexpensive replicas");
spamClassifier.classifyAndLog("windows");
spamClassifier.classifyAndLog("window");

var hypernyms = [{regexp: /inexpensive/g, feature: "cheap", confidence: 0.9}];
//console.log(JSON.stringify(hypernyms));
console.log("\nDomain adaptation (1) - add hypernym: ");
spamClassifier.setFeatureExtractorForClassification(FeaturesUnit.Hypernyms(hypernyms));

spamClassifier.classifyAndLog("cheap replica");
spamClassifier.classifyAndLog("inexpensive replicas");
spamClassifier.classifyAndLog("windows");
spamClassifier.classifyAndLog("window");

console.log("\nDomain adaptation (2) - add hypernym template: ");
spamClassifier.setFeatureExtractorForClassification(FeaturesUnit.Hypernyms([
	{regexp: "\\b(\\w+)s\\b", feature: "$1", confidence: 0.9},
]));
spamClassifier.classifyAndLog("cheap replica");
spamClassifier.classifyAndLog("inexpensive replicas");  // 'replicas' will trigger the feature 'replica'
spamClassifier.classifyAndLog("windows");  
spamClassifier.classifyAndLog("window"); // ... but 'window' will not trigger the feature 'windows'


// ... but 'window' will not trigger the feature 'windows', even if we train again:
console.log("\nTraining after adding the domain-adaptation classifier: ");
spamClassifier.trainBatch([
	{input: "cheap windows !!!", output: 1},
]);
spamClassifier.classifyAndLog("cheap replica");
spamClassifier.classifyAndLog("inexpensive replicas");
spamClassifier.classifyAndLog("windows");
spamClassifier.classifyAndLog("window");

console.log("ClassifierWithFeatureExtractor DomainAdaptation demo end");
