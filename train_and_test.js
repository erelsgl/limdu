/**
 * Static Utilities for training and testing classifiers.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

var associative = require('./associative');
var BinaryClassifierSet = require('./BinaryClassifierSet');
var PrecisionRecall = require("./PrecisionRecall");

/**
 * Test the given classifier on the given train-set and test-set.
 * @param binaryClassifierType identifies the type of classifier to test.
 * @param binaryClassifierOptions set of options for initializing that classifier.
 * @param trainSet, testSet arrays with objects of the format: {input: "sample1", output: "class1"}
 * @param verbosity [int] level of details in log (0 = no log)
 * @param microAverage, macroSum [output] - objects of type PrecisionRecall, used to return the results. 
 */
exports.train_and_test = function(binaryClassifierType, binaryClassifierOptions, trainSet, testSet, verbosity, microAverage, macroSum) {
	// TRAIN:
	var bcs = new BinaryClassifierSet(binaryClassifierType, binaryClassifierOptions, {});
	bcs.addClasses(trainSet.allClasses);
	for (var i=0; i<trainSet.length; ++i)
		bcs.train(trainSet[i].input, trainSet[i].output);

	// TEST:
	var currentStats = new PrecisionRecall();
	for (var i=0; i<testSet.length; ++i) {
		var expectedClasses = testSet[i].output;
		var actualClasses = bcs.classify(testSet[i].input);
		if (verbosity>1) console.log("\n"+testSet[i].input+": ");
		currentStats.addCases(expectedClasses, actualClasses, verbosity-1);
		microAverage.addCases(expectedClasses, actualClasses, 0);
	}
	currentStats.calculateStats();
	associative.add(macroSum, currentStats.fullStats());
	
	if (verbosity>0) {
		if (verbosity>1) {
			console.log("\n\nFULL RESULTS:")
			console.dir(currentStats.fullStats());
		}
		console.log("\nSUMMARY: "+currentStats.shortStats());
	}
}
