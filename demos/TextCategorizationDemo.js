/**
 * Demonstrates a full text-categorization system, with feature extractors and cross-validation.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

var util = require('util');
var datasets = require('../datasets');
var PrecisionRecall = require("../PrecisionRecall");
var train_and_test = require('../train_and_test').train_and_test;
var associative = require('../associative');
var serialize = require('../serialize');

console.log("text categorization demo start");

var dataset = datasets.read("../datasets/Dataset1Woz.txt");
var numOfFolds = 5; // for k-fold cross-validation

var microAverage = new PrecisionRecall();
var macroAverage = new PrecisionRecall();
var verbosity = 1;

var createNewClassifier = function() {
	var FeatureExtractor = require('../FeatureExtractor');
	var BinaryClassifierSet = require('../BinaryClassifierSet');
	var ClassifierWithFeatureExtractor = require('../ClassifierWithFeatureExtractor');
	
	var baseBinaryClassifierType = require('../svmjs').SVM;
	//var baseBinaryClassifierType = require('../brain').NeuralNetwork;
	//var baseBinaryClassifierType = require('../classifier/lib/bayesian').Bayesian;
	
	return new ClassifierWithFeatureExtractor({
		classifierType: BinaryClassifierSet,
		classifierOptions: {
				binaryClassifierType: baseBinaryClassifierType,
		//binaryClassifierType: ClassifierWithFeatureExtractor,
		//binaryClassifierOptions: {
				//classifierType:   baseBinaryClassifierType,
				binaryClassifierOptions: {
					C: 1.0,
					//iterations: 10,
					//log: true
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

var test_mode = false;

if (test_mode) {
	datasets.partitions(dataset, numOfFolds, function(partition) {
		//partition.train = partition.train.slice(0,3);
		//partition.test = partition.train;
		train_and_test(createNewClassifier,
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
	
} else {  // save mode
	var classifier = createNewClassifier();
	//dataset = dataset.slice(0,20);

	console.log("\nstart training on "+dataset.length+" samples");
	var startTime = new Date();
	classifier.trainBatch(dataset);
	var elapsedTime = new Date()-startTime;
	console.log("end training on "+dataset.length+" samples, "+elapsedTime+" [ms]");

	console.log("\ntest on training data:")
	for (var i=0; i<dataset.length; ++i) {
		var expectedClasses = dataset[i].output;
		var actualClasses = classifier.classify(dataset[i].input);
		console.log(dataset[i].input+": "+actualClasses);
	}
	
	serialize.saveSync(createNewClassifier, __dirname, classifier, 
		"serializations/TextCategorizationDemo.json");

	var classifier2 = serialize.loadSync(
		"serializations/TextCategorizationDemo.json");

	console.log("\ntest on training data after reload:")
	for (var i=0; i<dataset.length; ++i) {
		var expectedClasses = dataset[i].output;
		var actualClasses = classifier2.classify(dataset[i].input);
		console.log(dataset[i].input+": "+actualClasses);
	}
}

console.log("text categorization demo end");
