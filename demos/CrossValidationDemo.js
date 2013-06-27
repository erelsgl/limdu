/**
 * Demonstrates cross-validation testing of a classifier.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

var util = require('util');
var datasets = require('../datasets');
var PrecisionRecall = require("../PrecisionRecall");
var train_and_test = require('../train_and_test').train_and_test;
var associative = require('../associative');

console.log("cross-validation demo start");

var dataset = datasets.read("../datasets/Dataset1Woz.txt");
var numOfFolds = 5; // for k-fold cross-validation

var microAverage = new PrecisionRecall();
var macroAverage = new PrecisionRecall();
var verbosity = 1;

function createNewClassifier() {
	var FeatureExtractor = require('../FeatureExtractor');
	var BinaryClassifierSet = require('../BinaryClassifierSet');
	
	return new BinaryClassifierSet({
		binaryClassifierType: require('../classifier/lib/bayesian').Bayesian,
	});
}

datasets.partitions(dataset, numOfFolds, function(partition) {
	train_and_test(
		createNewClassifier,
		partition.train, partition.test, verbosity,
		microAverage, macroAverage
	);
});

associative.multiply_scalar(macroAverage, 1/numOfFolds);

console.log("\n\nMACRO AVERAGE FULL STATS:"); console.dir(macroAverage.fullStats());
console.log("\nMACRO AVERAGE SUMMARY: "+macroAverage.shortStats());

microAverage.calculateStats();
console.log("\n\nMICRO AVERAGE FULL STATS:"); console.dir(microAverage.fullStats());
console.log("\nMICRO AVERAGE SUMMARY: "+microAverage.shortStats());

console.log("cross-validation demo end");
