/**
 * Demonstrates cross-validation testing of a classifier.
 * 
 * @author Erel Segal-haLevi
 * @since 2013-06
 */

console.log("cross-validation demo start");

var fs = require('fs');
var datasets = require('../utils/partitions');
var PrecisionRecall = require("../utils/PrecisionRecall");
var trainAndTest = require('../utils/trainAndTest');
var _ = require('underscore')._;

var dataset = JSON.parse(fs.readFileSync("../datasets/Dataset1Woz.json"));
var numOfFolds = 5; // for k-fold cross-validation

var microAverage = new PrecisionRecall();
var macroAverage = new PrecisionRecall();
var verbosity = 1;

function createNewClassifier() {
	var FeatureExtractor = require('../features');
	var classifiers = require('../classifiers');
	return new classifiers.BinaryClassifierSet({
		binaryClassifierType: classifiers.Bayesian,
	});
}

datasets.partitions(dataset, numOfFolds, function(train, test) {
	trainAndTest(
		createNewClassifier,
		train, test, verbosity,
		microAverage, macroAverage
	);
});

_(macroAverage).each(function(value,key) {macroAverage[key]=value/numOfFolds});

console.log("\n\nMACRO AVERAGE FULL STATS:"); console.dir(macroAverage.fullStats());
console.log("\nMACRO AVERAGE SUMMARY: "+macroAverage.shortStats());

microAverage.calculateStats();
console.log("\n\nMICRO AVERAGE FULL STATS:"); console.dir(microAverage.fullStats());
console.log("\nMICRO AVERAGE SUMMARY: "+microAverage.shortStats());

console.log("cross-validation demo end");
