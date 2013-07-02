/**
 * Demonstrates a full text-categorization system, with feature extractors and cross-validation.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

var util = require('util');
var datasets = require('../datasets');
var PrecisionRecall = require("../PrecisionRecall");
var trainAndTest = require('../trainAndTest');
var hash = require('../hash');
var serialize = require('../serialize');
var _ = require('underscore')._;

console.log("text categorization demo start");

var dataset = datasets.read("../datasets/Dataset1Woz.txt");

var createBayesianClassifier = function() {
	var BinaryClassifierSet = require('../BinaryClassifierSet');
	var baseBinaryClassifierType = require('../classifier/lib/bayesian').Bayesian;
	return new BinaryClassifierSet({
		binaryClassifierType: baseBinaryClassifierType,
	});
}

var createPerceptronClassifier = function() {
	var BinaryClassifierSet = require('../BinaryClassifierSet');
	var EnhancedClassifier = require('../EnhancedClassifier');
	var FeatureExtractor = require('../FeatureExtractor');
	var baseBinaryClassifierType = require('../perceptron/perceptron_hash');
	
	return new EnhancedClassifier({
		classifierType: BinaryClassifierSet,
		classifierOptions: {
				binaryClassifierType: baseBinaryClassifierType,
				binaryClassifierOptions: {
					learning_rate: 1,
					retrain_count: 10,
					do_averaging: true,
					do_normalization: false,
				},
		},
		featureExtractor: FeatureExtractor.CollectionOfExtractors([
					FeatureExtractor.WordsFromText(1),
					//FeatureExtractor.WordsFromText(2),
					//FeatureExtractor.LettersFromText(3), 
					//FeatureExtractor.LettersFromText(4),
		]),
	});
}

var createSvmClassifier = function() {
	var EnhancedClassifier = require('../EnhancedClassifier');
	var FeatureExtractor = require('../FeatureExtractor');
	var BinaryClassifierSet = require('../BinaryClassifierSet');
	var baseBinaryClassifierType = require('../svmjs').SVM;
	
	return new EnhancedClassifier({
		classifierType: BinaryClassifierSet,
		classifierOptions: {
				binaryClassifierType: baseBinaryClassifierType,
				binaryClassifierOptions: {
					C: 1.0,
				},
		},
		featureExtractor: FeatureExtractor.CollectionOfExtractors([
					FeatureExtractor.WordsFromText(1),
					//FeatureExtractor.WordsFromText(2),
					//FeatureExtractor.LettersFromText(2), 
					//FeatureExtractor.LettersFromText(4),
		]),
		featureLookupTable: new FeatureExtractor.FeatureLookupTable(),
	});
}

//var createNewClassifier = createSvmClassifier;
var createNewClassifier = createPerceptronClassifier;

var do_cross_validation = true;
var do_serialization = true;

var verbosity = 0;

if (do_cross_validation) {
	var numOfFolds = 5; // for k-fold cross-validation
	var microAverage = new PrecisionRecall();
	var macroAverage = new PrecisionRecall();

	datasets.partitions(dataset, numOfFolds, function(partition) {
		//partition.train = partition.train.slice(0,3); partition.test = partition.train;
		trainAndTest(createNewClassifier,
			partition.train, partition.test, verbosity,
			microAverage, macroAverage
		);
	});
	hash.multiply_scalar(macroAverage, 1/numOfFolds);

	if (verbosity>0) {console.log("\n\nMACRO AVERAGE FULL STATS:"); console.dir(macroAverage.fullStats());}
	console.log("\nMACRO AVERAGE SUMMARY: "+macroAverage.shortStats());

	microAverage.calculateStats();
	if (verbosity>0) {console.log("\n\nMICRO AVERAGE FULL STATS:"); console.dir(microAverage.fullStats());}
	console.log("\nMICRO AVERAGE SUMMARY: "+microAverage.shortStats());
} // do_cross_validation

if (do_serialization) {
	var classifier = createNewClassifier();
	//dataset = dataset.slice(0,20);

	console.log("\nstart training on "+dataset.length+" samples");
	var startTime = new Date();
	classifier.trainBatch(dataset);
	var elapsedTime = new Date()-startTime;
	console.log("end training on "+dataset.length+" samples, "+elapsedTime+" [ms]");

	console.log("\ntest on training data:")
	resultsBeforeReload = [];
	for (var i=0; i<dataset.length; ++i) {
		var expectedClasses = dataset[i].output;
		var actualClasses = classifier.classify(dataset[i].input);
		resultsBeforeReload[i] = actualClasses;
		if (verbosity>0) console.log(dataset[i].input+": "+actualClasses);
	}
	
	serialize.saveSync(createNewClassifier, classifier, 
		"serializations/TextCategorizationDemo.json");

	var classifier2 = serialize.loadSync(
		"serializations/TextCategorizationDemo.json", __dirname);

	console.log("\ntest on training data after reload:")
	for (var i=0; i<dataset.length; ++i) {
		var expectedClasses = dataset[i].output;
		var actualClasses = classifier2.classify(dataset[i].input);
		if (!_(resultsBeforeReload[i]).isEqual(actualClasses)) {
			throw new Error("Reload does not reproduce the original classifier! before reload="+resultsBeforeReload[i]+", after reload="+actualClasses);
		}
		if (verbosity>0) console.log(dataset[i].input+": "+actualClasses);
	}
} // do_serialization

console.log("text categorization demo end");
