var util = require('util');
var classifier = require('./classifier');
var BinaryClassifierSet = require('./BinaryClassifierSet');
var datasets = require('./datasets');
var PrecisionRecall = require("./PrecisionRecall");

console.log("BinaryClassifierSet demo start");

var dataset = datasets.read("datasets/Dataset1Woz.txt");
//console.dir(dataset);
//console.dir(dataset.allClasses);

// TRAIN:
var bcs = new BinaryClassifierSet(classifier.Bayesian, {}, {});
bcs.addClasses(dataset.allClasses);
for (var i=0; i<dataset.length; ++i)
	bcs.train(dataset[i].sample, dataset[i].classes);

//console.log(JSON.stringify(bcs.toJSON()));

// TEST ON TRAINING DATA:
var pr = new PrecisionRecall();
for (var i=0; i<dataset.length; ++i) {
	var expectedClasses = dataset[i].classes;
	var actualClasses = bcs.classify(dataset[i].sample);
	console.log("\n"+dataset[i].sample+": ");
	pr.addCases(expectedClasses, actualClasses, true);
}
console.log("\n\nFULL RESULTS:")
console.dir(pr.fullResults());
console.log("\nSUMMARY: "+pr.shortResults());

console.log("BinaryClassifierSet demo end");
