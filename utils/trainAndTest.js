/**
 * Static utility function for training and testing classifiers.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

var _ = require('underscore')._;
var util = require('util');
var hash = require('./hash');
var PrecisionRecall = require("./PrecisionRecall");

/**
 * A short light-weight test function. Tests the given classifier on the given dataset, and 
 * writes a short summary of the mistakes and total performance.
 * @param explain level of explanations for mistakes (0 for none) 
 */
module.exports.testLite = function(classifier, dataset, explain) {
	var currentStats = new PrecisionRecall();
	for (var i=0; i<dataset.length; ++i) {
		var expectedClasses = normalizeClasses(dataset[i].output); 
		var actualClassesWithExplanations = classifier.classify(dataset[i].input, explain);
		actualClasses = (actualClassesWithExplanations.classes? actualClassesWithExplanations.classes: actualClassesWithExplanations);
		actualClasses.sort();
		if (!_(expectedClasses).isEqual(actualClasses)) {
			console.log(
				"\t"+JSON.stringify(dataset[i].input)+":"+
				" expected "+expectedClasses+
				" but got "+(explain>0? JSON.stringify(actualClassesWithExplanations,null,"\t"): actualClasses));
		}
		currentStats.addCases(expectedClasses, actualClasses);
	}
	console.log("SUMMARY: "+currentStats.calculateStats().shortStats());
	return currentStats;
};

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
	return currentStats;
};

/**
 * Compare two classifiers on the same dataset. 
 * writes a short summary of the differences between them and total performance.
 * @param explain level of explanations for mistakes (0 for none) 
 */
module.exports.compare = function(classifier1, classifier2, dataset, explain) {
	for (var i=0; i<dataset.length; ++i) {
		var expectedClasses = normalizeClasses(dataset[i].output); 
		var actualClassesWithExplanations1 = classifier1.classify(dataset[i].input, explain);
		var actualClassesWithExplanations2 = classifier2.classify(dataset[i].input, explain);
		actualClasses1 = (explain>0? actualClassesWithExplanations1.classes: actualClassesWithExplanations1);
		actualClasses2 = (explain>0? actualClassesWithExplanations2.classes: actualClassesWithExplanations2);
		actualClasses1.sort();
		actualClasses2.sort();
		if (!_(actualClasses1).isEqual(actualClasses2)) {
			console.log("\t"+JSON.stringify(dataset[i].input)+
				" : classes1="+(explain>0? JSON.stringify(actualClassesWithExplanations1,null,"\t"): actualClasses1)+
				" ; classes2="+(explain>0? JSON.stringify(actualClassesWithExplanations2,null,"\t"): actualClasses2)+
				"");
			if (_(actualClasses1).isEqual(expectedClasses)) {
				console.log("\t\tClassifier1 is correct");
			} else if (_(actualClasses2).isEqual(expectedClasses)) {
				console.log("\t\tClassifier2 is correct");
			} else {
				console.log("\t\tboth are incorrect");
			}
		}
	}
};

/**easy
 * Split the given dataset to two datasets: 
 ** easy (the classifier gets right), 
 ** and hard (the classifier errs).  
 */
module.exports.splitToEasyAndHard = function(classifier, dataset) {
	var easyDataset = [];
	var hardDataset = [];
	for (var i=0; i<dataset.length; ++i) {
		var expectedClasses = normalizeClasses(dataset[i].output); 
		var actualClasses = classifier.classify(dataset[i].input);
		actualClasses.sort();
		if (_(expectedClasses).isEqual(actualClasses)) {
			easyDataset.push(dataset[i]);
		} else {
			hardDataset.push(dataset[i]);
		}
	}
	return {easy: easyDataset, hard: hardDataset};
};

/**
 * Test the given classifier-type on the given train-set and test-set.
 * @param createNewClassifierFunction a function that creates a new, empty, untrained classifier
 * @param trainSet, testSet arrays with objects of the format: {input: "sample1", output: "class1"}
 * @param verbosity [int] level of details in log (0 = no log)
 * @param microAverage, macroSum [output] - objects of type PrecisionRecall, used to return the results. 
 * @return the currentStats.
 */
module.exports.trainAndTestLite = function(
		createNewClassifierFunction, 
		trainSet, testSet, 
		verbosity, microAverage, macroSum) {
		// TRAIN:
		var classifier = createNewClassifierFunction();

		if (verbosity>0) console.log("\nstart training on "+trainSet.length+" samples, "+(trainSet.allClasses? trainSet.allClasses.length+' classes': ''));
		var startTime = new Date();
		classifier.trainBatch(trainSet);
		var elapsedTime = new Date()-startTime;
		if (verbosity>0) console.log("end training on "+trainSet.length+" samples, "+(trainSet.allClasses? trainSet.allClasses.length+' classes, ': '')+elapsedTime+" [ms]");
	
		// TEST:
		return module.exports.testLite(classifier, testSet, /*explain=*/verbosity-1);
};

/**
 * Test the given classifier-type on the given train-set and test-set.
 * @param createNewClassifierFunction a function that creates a new, empty, untrained classifier
 * @param trainSet, testSet arrays with objects of the format: {input: "sample1", output: "class1"}
 * @param verbosity [int] level of details in log (0 = no log)
 * @param microAverage, macroSum [output] - objects of type PrecisionRecall, used to return the results. 
 * @return the currentStats.
 */
module.exports.trainAndTest = function(
		classifierType, 
		trainSet, testSet, 
		verbosity, microAverage, macroSum) {
		// TRAIN:
		var classifier = new classifierType();

		if (verbosity>0) console.log("\nstart training on "+trainSet.length+" samples, "+(trainSet.allClasses? trainSet.allClasses.length+' classes': ''));
		var startTime = new Date();
		classifier.trainBatch(trainSet);
		//console.log(classifier.featureDocumentFrequency['i']);
		var elapsedTime = new Date()-startTime;
		if (verbosity>0) console.log("end training on "+trainSet.length+" samples, "+(trainSet.allClasses? trainSet.allClasses.length+' classes, ': '')+elapsedTime+" [ms]");
	
		// TEST:
		return module.exports.test(classifier, testSet, verbosity, microAverage, macroSum);
};

module.exports.trainAndCompare = function(
		createNewClassifier1Function, createNewClassifier2Function,
		trainSet, testSet, verbosity) {
		// TRAIN:
		var classifier1 = createNewClassifier1Function();
		var classifier2 = createNewClassifier2Function();

		if (verbosity>0) console.log("\nstart training on "+trainSet.length+" samples, "+(trainSet.allClasses? trainSet.allClasses.length+' classes': ''));
		var startTime = new Date();
		classifier1.trainBatch(trainSet);
		var elapsedTime = new Date()-startTime;
		if (verbosity>0) console.log("end training on "+trainSet.length+" samples, "+(trainSet.allClasses? trainSet.allClasses.length+' classes, ': '')+elapsedTime+" [ms]");

		if (verbosity>0) console.log("start training on "+trainSet.length+" samples, "+(trainSet.allClasses? trainSet.allClasses.length+' classes': ''));
		var startTime = new Date();
		classifier2.trainBatch(trainSet);
		var elapsedTime = new Date()-startTime;
		if (verbosity>0) console.log("end training on "+trainSet.length+" samples, "+(trainSet.allClasses? trainSet.allClasses.length+' classes, ': '')+elapsedTime+" [ms]");
	
		// TEST:
		return module.exports.compare(classifier1, classifier2, testSet, verbosity);
};


/**
 * Train on datasets[0], test on datasets[1].
 * Train on datasets[0+1], test on datasets[2].
 * Train on datasets[0+1+2], test on datasets[3].
 * etc...
 */
module.exports.learningCurve = function(createNewClassifierFunction, datasets, verbosity) {

	var trainSet = [];
	for (var i=1; i<datasets.length; ++i) {
		trainSet = trainSet.concat(datasets[i-1]);
		var testSet = datasets[i];

		var classifier = createNewClassifierFunction();
		var startTime = new Date();
		classifier.trainBatch(trainSet);
		var elapsedTime = new Date()-startTime;
		var testStats = module.exports.test(classifier, testSet, verbosity).shortStats();

		console.log("Train on "+trainSet.length+" samples ("+elapsedTime+" ms): "+testStats);
	}
};






var stringifyClass = function (aClass) {
	return (_(aClass).isString()? aClass: JSON.stringify(aClass));
};

var normalizeClasses = function (expectedClasses) {
	if (!_(expectedClasses).isArray())
		expectedClasses = [expectedClasses];
	expectedClasses = expectedClasses.map(stringifyClass);
	expectedClasses.sort();
	return expectedClasses;
};
