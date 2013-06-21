var util = require('util');
var BayesianClassifier = require('./classifier').Bayesian;
var NeuralNetwork = require('./brain').NeuralNetwork;
var BinaryClassifierSet = require('./BinaryClassifierSet');
var datasets = require('./datasets');
var PrecisionRecall = require("./PrecisionRecall");
var train_and_test = require('./train_and_test').train_and_test;
var associative = require('./associative');

var WordsFromText = require('./FeatureExtractor/WordExtractor').WordsFromText;

console.log("main demo start");

var net = new NeuralNetwork();

net.trainAll([{input: WordsFromText("cheap replica watches"), output: {'spam': 1, 'cheap': 1, 'nice': 0}},
           {input: WordsFromText("works on windows?"), output: {'spam': 0, 'windows': 1, 'cheap': 0}},
           {input: WordsFromText("wind chea"), output: [1]},
           ]    );

console.log(net.run(WordsFromText("replica")));
console.log(net.run(WordsFromText("windows")));
console.log(net.run(WordsFromText("replica windows")));
console.log(net.run(WordsFromText("windows replica")));
console.log(net.run(WordsFromText("cheap windows replica")));
console.log(net.run(WordsFromText("wind")));
console.log(net.run(WordsFromText("chea")));
process.exit(1);

var dataset = datasets.read("datasets/Dataset1Woz.txt");
var numOfFolds = 10; // for 10-fold cross-validation

var binaryClassifierType = NeuralNetwork; // BayesianClassifier;
var binaryClassifierOptions = {};
var microAverage = new PrecisionRecall();
var macroAverage = new PrecisionRecall();
var verbosity = 1;

datasets.partitions(dataset, numOfFolds, function(partition) {
	train_and_test(
		binaryClassifierType, binaryClassifierOptions,
		partition.train, partition.test, verbosity,
		microAverage, macroAverage
	);
});

associative.multiply_scalar(macroAverage, 1/numOfFolds);

console.log("\n\nMACRO AVERAGE FULL STATS:")
console.dir(macroAverage.fullStats());
console.log("\nSUMMARY: "+macroAverage.shortStats());

microAverage.calculateStats();
console.log("\n\nMICRO AVERAGE FULL STATS:")
console.dir(microAverage.fullStats());
console.log("\nSUMMARY: "+microAverage.shortStats());

console.log("main demo end");
