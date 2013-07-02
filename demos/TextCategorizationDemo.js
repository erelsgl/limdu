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
var collectedDataset = JSON.parse(fs.readFileSync("../datasets/Dataset1Woz.json"));
var combinedDataset = domainDataset.concat(collectedDataset);

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
					retrain_count: 10,
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

var do_domain_testing = true;
var do_cross_validation = true;
var do_serialization = true;

var verbosity = 0;

if (do_domain_testing) {
	var trainAndTest = require('../trainAndTest');

	var train = domainDataset;
	var test = collectedDataset;
	var stats = trainAndTest(createNewClassifier,
		train, test, verbosity);
	if (verbosity>0) {console.log("\n\nFULL STATS:"); console.dir(stats.fullStats());}
	console.log("\nSUMMARY: "+stats.shortStats());
}

if (do_cross_validation) {
	var datasets = require('../datasets');
	var PrecisionRecall = require("../PrecisionRecall");
	var trainAndTest = require('../trainAndTest');

	var numOfFolds = 5; // for k-fold cross-validation
	var microAverage = new PrecisionRecall();
	var macroAverage = new PrecisionRecall();

	var dataset = collectedDataset;
	console.log("\nstart "+numOfFolds+"-fold cross-validation on "+dataset.length+" samples");
	datasets.partitions(dataset, numOfFolds, function(train, test, index) {
		console.log("partition #"+index);
		trainAndTest(createNewClassifier,
			train, test, verbosity,
			microAverage, macroAverage
		);
	});
	_(macroAverage).each(function(value,key) { macroAverage[key]=value/numOfFolds; });
	console.log("\nend "+numOfFolds+"-fold cross-validation on "+dataset.length+" samples");

	if (verbosity>0) {console.log("\n\nMACRO AVERAGE FULL STATS:"); console.dir(macroAverage.fullStats());}
	console.log("\nMACRO AVERAGE SUMMARY: "+macroAverage.shortStats());

	microAverage.calculateStats();
	if (verbosity>0) {console.log("\n\nMICRO AVERAGE FULL STATS:"); console.dir(microAverage.fullStats());}
	console.log("\nMICRO AVERAGE SUMMARY: "+microAverage.shortStats());
} // do_cross_validation

if (do_serialization) {
	var classifier = createNewClassifier();
	var dataset = combinedDataset;
	//dataset = dataset.slice(0,20);
	console.log("\nstart training on "+dataset.length+" samples");
	var startTime = new Date();
	classifier.trainBatch(dataset);
	console.log("end training on "+dataset.length+" samples, "+(new Date()-startTime)+" [ms]");

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
