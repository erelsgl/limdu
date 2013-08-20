/**
 * Demonstrates cross-validation testing of a classifier.
 * 
 * @author Erel Segal-haLevi
 * @since 2013-06
 */

console.log("cross-validation demo start");

var fs = require('fs');
var mlutils = require("../utils");
var _ = require('underscore')._;

var dataset = JSON.parse(fs.readFileSync("../datasets/Dataset1Woz.json"));
var numOfFolds = 5; // for k-fold cross-validation

var microAverage = new mlutils.PrecisionRecall();
var macroAverage = new mlutils.PrecisionRecall();

var verbosity = 1;

function createNewClassifier() {
	var FeaturesUnit = require('../features');
	var classifiers = require('../classifiers');
	return new classifiers.BinaryClassifierSet({
		binaryClassifierType: classifiers.Bayesian,
	});
}

mlutils.partitions.partitions(dataset, numOfFolds, function(train, test) {
	mlutils.trainAndTest(
		createNewClassifier,
		train, test, verbosity,
		microAverage, macroAverage
	);
});

for (var key in macroAverage) {
	if (_(macroAverage[key]).isNumber()) 
		macroAverage[key] /= numOfFolds;
};

macroAverage.calculateStats();
console.log("\n\nMACRO AVERAGE FULL STATS:"); console.dir(macroAverage.fullStats());
console.log("\nMACRO AVERAGE SUMMARY: "+macroAverage.shortStats());

microAverage.calculateStats();
console.log("\n\nMICRO AVERAGE FULL STATS:"); console.dir(microAverage.fullStats());
console.log("\nMICRO AVERAGE SUMMARY: "+microAverage.shortStats());

console.log("cross-validation demo end");
