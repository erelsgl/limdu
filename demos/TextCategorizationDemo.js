/**
 * Demonstrates a full text-categorization system, with feature extractors and cross-validation.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

var serialize = require('../utils/serialize');
var _ = require('underscore')._;
var fs = require('fs');

console.log("text categorization demo start");

var domainDataset = JSON.parse(fs.readFileSync("../datasets/Dataset0Domain.json"));
var grammarDataset = JSON.parse(fs.readFileSync("../datasets/Dataset0Grammar.json"));
var collectedDatasetMulti = JSON.parse(fs.readFileSync("../datasets/Dataset1Woz.json"));
var collectedDatasetSingle = JSON.parse(fs.readFileSync("../datasets/Dataset1Woz1class.json"));

var createBayesianClassifier = function() {
	var classifiers = require('../classifiers');
	return new classifiers.BinaryClassifierSet({
		binaryClassifierType: classifiers.Bayesian,
	});
}

var createPerceptronClassifier = function() {
	var classifiers = require('../classifiers');
	var FeatureExtractor = require('../features');
	
	return new classifiers.EnhancedClassifier({
		classifierType: classifiers.BinaryClassifierSet,
		classifierOptions: {
				binaryClassifierType: classifiers.Perceptron,
				binaryClassifierOptions: {
					learning_rate: 1,
					retrain_count: 5,
					do_averaging: true,      // common practice in perceptrons
					do_normalization: false, 
				},
		},
		featureExtractor: [
					FeatureExtractor.WordsFromText(1),
					//FeatureExtractor.WordsFromText(2),
					//FeatureExtractor.LettersFromText(3), 
					//FeatureExtractor.LettersFromText(4),
		],
	});
}

var createWinnowClassifier = function() {
	var classifiers = require('../classifiers');
	var FeatureExtractor = require('../features');

	return new classifiers.EnhancedClassifier({
		classifierType: classifiers.BinaryClassifierSet,
		classifierOptions: {
				binaryClassifierType: classifiers.Winnow,
				binaryClassifierOptions: {
					retrain_count: 25,
					do_averaging: false,
					margin: 1,
				},
		},
		featureExtractor: [
					FeatureExtractor.WordsFromText(1),
					FeatureExtractor.WordsFromText(2),
					//FeatureExtractor.LettersFromText(3), 
					//FeatureExtractor.LettersFromText(4),
		],		
	});
}

var createSvmClassifier = function() {
	var classifiers = require('../classifiers');
	var FeatureExtractor = require('../features');
	
	return new classifiers.EnhancedClassifier({
		classifierType: classifiers.BinaryClassifierSet,
		classifierOptions: {
				binaryClassifierType: classifiers.SVM,
				binaryClassifierOptions: {
					C: 1.0,
				},
		},
		featureExtractor: [
					FeatureExtractor.WordsFromText(1),
					FeatureExtractor.WordsFromText(2),
					//FeatureExtractor.LettersFromText(2), 
					//FeatureExtractor.LettersFromText(4),
		],
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

var partitions = require('../utils/partitions');
var PrecisionRecall = require("../utils/PrecisionRecall");
var trainAndTest = require('../utils/trainAndTest');

if (do_cross_dataset_testing) {
	console.log("\nTrain on domain data, test on woz single class: "+
		trainAndTest(createNewClassifier, domainDataset, collectedDatasetSingle, verbosity).shortStats());
	console.log("\nTrain on domain data, test on woz multi class: "+
		trainAndTest(createNewClassifier, domainDataset, collectedDatasetMulti, verbosity).shortStats());
	console.log("\nTrain on grammar data, test on woz single class: "+
		trainAndTest(createNewClassifier, grammarDataset, collectedDatasetSingle, verbosity).shortStats());
	console.log("\nTrain on grammar data, test on woz multi class: "+
		trainAndTest(createNewClassifier, grammarDataset, collectedDatasetMulti, verbosity).shortStats());
	console.log("\nTrain on woz single class, test on woz multi class: "+
		trainAndTest(createNewClassifier, collectedDatasetSingle, collectedDatasetMulti, verbosity).shortStats());
	console.log("\nTrain on woz multi class, test on woz single class: "+
		trainAndTest(createNewClassifier, collectedDatasetMulti, collectedDatasetSingle, verbosity).shortStats());
	
	collectedDatasetMultiPartition = partitions.partition(collectedDatasetMulti, 0, collectedDatasetMulti.length/2);
	collectedDatasetSinglePartition = partitions.partition(collectedDatasetSingle, 0, collectedDatasetSingle.length/2);
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
} // do_cross_dataset_testing

if (do_cross_validation) {

	var numOfFolds = 5; // for k-fold cross-validation
	var microAverage = new PrecisionRecall();
	var macroAverage = new PrecisionRecall();
	
	var devSet = collectedDatasetMulti.concat(collectedDatasetSingle);

	console.log("\nstart "+numOfFolds+"-fold cross-validation on "+grammarDataset.length+" grammar samples and "+devSet.length+" collected samples");
	partitions.partitions(devSet, numOfFolds, function(trainSet, testSet, index) {
		console.log("partition #"+index);
		trainAndTest(createNewClassifier,
			trainSet.concat(grammarDataset), testSet, verbosity,
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
	var dataset = grammarDataset.concat(collectedDatasetMulti).concat(collectedDatasetSingle);

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
	
	fs.writeFileSync("serializations/TextCategorizationDemo.json", 
		serialize.toString(createNewClassifier, classifier), 'utf8');

	var classifier2 = serialize.fromString(
		fs.readFileSync("serializations/TextCategorizationDemo.json"), __dirname);

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
