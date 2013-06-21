var util = require('util');
var BayesianClassifier = require('./classifier').Bayesian;
var NeuralNetwork = require('./brain').NeuralNetwork;
var BinaryClassifierSet = require('./BinaryClassifierSet');
var datasets = require('./datasets');
var PrecisionRecall = require("./PrecisionRecall");

var WordsFromText = require('./FeatureExtractor/WordExtractor').WordsFromText;
var WordsFromText1 = WordsFromText(1);

console.log("main demo start");

var net = new NeuralNetwork();

net.trainAll([{input: WordsFromText1("cheap replica watches"), output: {'spam': 1, 'cheap': 1, 'nice': 0}},
           {input: WordsFromText1("works on windows?"), output: {'spam': 0, 'windows': 1, 'cheap': 0}},
           {input: WordsFromText1("wind chea"), output: [1]},
           ]    );

console.log(net.run(WordsFromText1("replica")));
console.log(net.run(WordsFromText1("windows")));
console.log(net.run(WordsFromText1("replica windows")));
console.log(net.run(WordsFromText1("windows replica")));
console.log(net.run(WordsFromText1("cheap windows replica")));
console.log(net.run(WordsFromText1("wind")));
console.log(net.run(WordsFromText1("chea")));
