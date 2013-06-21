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

var WordsFromText = require('../FeatureExtractor/WordExtractor').WordsFromText;
var LettersFromText = require('../FeatureExtractor/LetterExtractor').LettersFromText;
var CollectionOfExtractors = require('../FeatureExtractor/CollectionOfExtractors').CollectionOfExtractors;

console.log("text categorization demo start");

var dataset = datasets.read("../datasets/Dataset1Woz.txt");
var numOfFolds = 2; // for k-fold cross-validation

var microAverage = new PrecisionRecall();
var macroAverage = new PrecisionRecall();
var verbosity = 1;

datasets.partitions(dataset, numOfFolds, function(partition) {
	//partition.train = partition.train.slice(0,16);
	train_and_test(
		{
			binaryClassifierType: require('../ClassifierWithFeatureExtractor'),
			binaryClassifierOptions: {
				classifierType:   require('../brain/lib/brain').NeuralNetwork,
				classifierOptions: {
					//iterations: 10,
					//log: true
				},
				featureExtractor: CollectionOfExtractors([
				    WordsFromText(1),
				    //WordsFromText(2),
				    //LettersFromText(2), 
				    //LettersFromText(3),
				]), 
			}
		},
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

console.log("text categorization demo end");
