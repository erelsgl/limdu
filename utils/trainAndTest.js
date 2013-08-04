/**
 * Static utility function for training and testing classifiers.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

var _ = require('underscore')._;
var hash = require('./hash');
var PrecisionRecall = require("./PrecisionRecall");

var stringifyClass = function (aClass) {
	return (_(aClass).isString()? aClass: JSON.stringify(aClass));
}

var normalizeClasses = function (expectedClasses) {
	if (!_(expectedClasses).isArray())
		expectedClasses = [expectedClasses];
	expectedClasses = expectedClasses.map(stringifyClass);
	expectedClasses.sort();
	return expectedClasses;
}

/**
 * A short light-weight test function. Tests the given classifier on the given dataset, and 
 * writes a short summary of the mistakes and performance.
 * @param explain level of explanations for mistakes (0 for none) 
 */
module.exports.testLite = function(classifier, dataset, explain) {
	var currentStats = new PrecisionRecall();
	for (var i=0; i<dataset.length; ++i) {
		var expectedClasses = normalizeClasses(dataset[i].output); 
		var actualClassesWithExplanations = classifier.classify(dataset[i].input, explain);
		actualClasses = (explain? actualClassesWithExplanations.classes: actualClassesWithExplanations);
		actualClasses.sort();
		if (!_(expectedClasses).isEqual(actualClasses)) {
			console.log("\t"+dataset[i].input+": expected "+expectedClasses+" but got "+(explain? JSON.stringify(actualClassesWithExplanations,null,"\t"): actualClasses));
		}
		currentStats.addCases(expectedClasses, actualClasses);
	}
	console.log("SUMMARY: "+currentStats.calculateStats().shortStats());
}

/**
 * Test the given classifier on the given test-set.
 * @param classifier a (trained) classifier.
 * @param testSet array with objects of the format: {input: "sample1", output: "class1"}
 * @param verbosity [int] level of details in log (0 = no log)
 * @param microAverage, macroSum [optional; output] - objects of type PrecisionRecall, used to return the results. 
 * @return the currentStats.
 */
module.exports.test = function(
		classifier, testSet, 
		verbosity, microAverage, macroSum) {
		var currentStats = new PrecisionRecall();
		for (var i=0; i<testSet.length; ++i) {
			var expectedClasses = normalizeClasses(testSet[i].output);
			var actualClasses = classifier.classify(testSet[i].input);
			var explanations = currentStats.addCases(expectedClasses, actualClasses, (verbosity>2));
			if (verbosity>1 && explanations.length>0) console.log("\t"+testSet[i].input+": \n"+explanations.join("\n"));
			if (microAverage) microAverage.addCases(expectedClasses, actualClasses);
		}
		currentStats.calculateStats();
		if (macroSum) hash.add(macroSum, currentStats.fullStats());
		
		if (verbosity>0) {
			if (verbosity>2) {
				console.log("FULL RESULTS:")
				console.dir(currentStats.fullStats());
			}
			console.log("SUMMARY: "+currentStats.shortStats());
		}
		
		return currentStats;
};

/**
 * Test the given classifier on the given train-set and test-set.
 * @param createNewClassifierFunction a function that creates a new, empty, untrained classifier (of type BinaryClassifierSet).
 * @param trainSet, testSet arrays with objects of the format: {input: "sample1", output: "class1"}
 * @param verbosity [int] level of details in log (0 = no log)
 * @param microAverage, macroSum [output] - objects of type PrecisionRecall, used to return the results. 
 * @return the currentStats.
 */
module.exports.trainAndTest = function(
		createNewClassifierFunction, 
		trainSet, testSet, 
		verbosity, microAverage, macroSum) {
		// TRAIN:
		var classifier = createNewClassifierFunction();
		//classifier.addClasses(trainSet.allClasses); // not needed - handled by trainBatch
		if (verbosity>0) console.log("\nstart training on "+trainSet.length+" samples, "+(trainSet.allClasses? trainSet.allClasses.length+' classes': ''));
		var startTime = new Date()
		if (verbosity>2) console.dir(trainSet);
		classifier.trainBatch(trainSet);
		var elapsedTime = new Date()-startTime;
		if (verbosity>0) console.log("end training on "+trainSet.length+" samples, "+(trainSet.allClasses? trainSet.allClasses.length+' classes, ': '')+elapsedTime+" [ms]");
	
		// TEST:
		return module.exports.test(classifier, testSet, verbosity, microAverage, macroSum);
};
