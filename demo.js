var util = require('util');
var BayesianClassifier = require('./classifier').Bayesian;
var NeuralNetwork = require('./brain').NeuralNetwork;
var BinaryClassifierSet = require('./BinaryClassifierSet');
var datasets = require('./datasets');
var PrecisionRecall = require("./PrecisionRecall");
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
