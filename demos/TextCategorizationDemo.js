/**
 * Demonstrates a full text-categorization system, with feature extractors and cross-validation.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

var serialize = require('../serialize');
var _ = require('underscore')._;
var fs = require('fs');

console.log("text categorization demo start");

var domainDataset = JSON.parse(fs.readFileSync("../datasets/Dataset0Domain.json"));
var collectedDatasetMulti = JSON.parse(fs.readFileSync("../datasets/Dataset1Woz.json"));
var collectedDatasetSingle = JSON.parse(fs.readFileSync("../datasets/Dataset1Woz1class.json"));

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
					retrain_count: 5,
					do_averaging: true,      // common practice in perceptrons
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

var createWinnowClassifier = function() {
	var BinaryClassifierSet = require('../BinaryClassifierSet');
	var EnhancedClassifier = require('../EnhancedClassifier');
	var FeatureExtractor = require('../FeatureExtractor');
	var baseBinaryClassifierType = require('../winnow/winnow_hash');

	return new EnhancedClassifier({
		classifierType: BinaryClassifierSet,
		classifierOptions: {
				binaryClassifierType: baseBinaryClassifierType,
				binaryClassifierOptions: {
					retrain_count: 25,
					do_averaging: false,
					margin: 1,
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

var createNewClassifier = createWinnowClassifier;
//var createNewClassifier = createSvmClassifier;
//var createNewClassifier = createPerceptronClassifier;

var do_cross_dataset_testing = true;
var do_cross_validation = true;
var do_serialization = true;

var verbosity = 0;
var explain = 0;

var datasets = require('../datasets');
var PrecisionRecall = require("../PrecisionRecall");
var trainAndTest = require('../trainAndTest');

if (do_cross_dataset_testing) {
	console.log("\nTrain on domain data, test on woz single class: "+
		trainAndTest(createNewClassifier, domainDataset, collectedDatasetSingle, verbosity).shortStats());
	console.log("\nTrain on domain data, test on woz multi class: "+
		trainAndTest(createNewClassifier, domainDataset, collectedDatasetMulti, verbosity).shortStats());
	console.log("\nTrain on woz single class, test on woz multi class: "+
		trainAndTest(createNewClassifier, collectedDatasetSingle, collectedDatasetMulti, verbosity).shortStats());
	console.log("\nTrain on woz multi class, test on woz single class: "+
		trainAndTest(createNewClassifier, collectedDatasetMulti, collectedDatasetSingle, verbosity).shortStats());
	
	collectedDatasetMultiPartition = datasets.partition(collectedDatasetMulti, 0, collectedDatasetMulti.length/2);
	collectedDatasetSinglePartition = datasets.partition(collectedDatasetSingle, 0, collectedDatasetSingle.length/2);
	console.log("\nTrain on mixed, test on mixed: "+
		trainAndTest(createNewClassifier, 
			collectedDatasetMultiPartition.train.concat(collectedDatasetSinglePartition.train), 
			collectedDatasetMultiPartition.test.concat(collectedDatasetSinglePartition.test), 
			verbosity).shortStats());
	console.log("\nTrain on mixed, test on mixed (2): "+
		trainAndTest(createNewClassifier, 
			collectedDatasetMultiPartition.test.concat(collectedDatasetSinglePartition.test), 
			collectedDatasetMultiPartition.train.concat(collectedDatasetSinglePartition.train), 
			verbosity).shortStats());

	var trainSet = domainDataset;
	var testSet = collectedDatasetMulti;
	
	var stats = trainAndTest(createNewClassifier,
		trainSet, testSet, verbosity);

	var classifier = createNewClassifier();
	classifier.trainBatch(trainSet);
	
	if (explain) {
		for (var i=0; i<testSet.length; ++i) {
			var expectedClasses = testSet[i].output;
			var actualClasses = classifier.classify(testSet[i].input, explain);
			if (_(expectedClasses).isEqual(actualClasses.classes)) {
				console.log(testSet[i].input+": CORRECT");
			} else {
				console.log(testSet[i].input+": INCORRECT: ");
				console.dir(actualClasses);
			}
		}
	}
	
} // do_cross_dataset_testing

if (do_cross_validation) {

	var numOfFolds = 5; // for k-fold cross-validation
	var microAverage = new PrecisionRecall();
	var macroAverage = new PrecisionRecall();
	
	var devSet = collectedDatasetMulti.concat(collectedDatasetSingle);

	console.log("\nstart "+numOfFolds+"-fold cross-validation on "+domainDataset.length+" domain samples and "+devSet.length+" collected samples");
	datasets.partitions(devSet, numOfFolds, function(trainSet, testSet, index) {
		console.log("partition #"+index);
		trainAndTest(createNewClassifier,
			trainSet.concat(domainDataset), testSet, verbosity,
			microAverage, macroAverage
		);
	});
	_(macroAverage).each(function(value,key) { macroAverage[key]=value/numOfFolds; });
	console.log("\nend "+numOfFolds+"-fold cross-validation");

	if (verbosity>0) {console.log("\n\nMACRO AVERAGE FULL STATS:"); console.dir(macroAverage.fullStats());}
	console.log("\nMACRO AVERAGE SUMMARY: "+macroAverage.shortStats());

	microAverage.calculateStats();
	if (verbosity>0) {console.log("\n\nMICRO AVERAGE FULL STATS:"); console.dir(microAverage.fullStats());}
	console.log("\nMICRO AVERAGE SUMMARY: "+microAverage.shortStats());
} // do_cross_validation

if (do_serialization) {
	var classifier = createNewClassifier();
	var dataset = domainDataset.concat(collectedDatasetMulti).concat(collectedDatasetSingle);

	//dataset = dataset.slice(0,20);
	console.log("\nstart training on "+dataset.length+" samples");
	var startTime = new Date();
	classifier.trainBatch(dataset);
	console.log("end training on "+dataset.length+" samples, "+(new Date()-startTime)+" [ms]");

	console.log("\ntest on training data:")
	resultsBeforeReload = [];
	var currentStats = new PrecisionRecall();
	for (var i=0; i<dataset.length; ++i) {
		var expectedClasses = dataset[i].output;
		var actualClasses = classifier.classify(dataset[i].input);
		if (verbosity>0) console.log(dataset[i].input+": "+actualClasses);
		currentStats.addCases(expectedClasses, actualClasses, verbosity-1);
		resultsBeforeReload[i] = actualClasses;
	}
	currentStats.calculateStats();
	console.log(currentStats.shortStats());
	
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
