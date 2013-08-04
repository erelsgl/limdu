/**
 * Demonstrates multi label classification - zero or more classes per sample
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

console.log("Multi-Label Classification demo start");

var classifiers = require('../classifiers');

var classifier = new classifiers.BinaryClassifierSet({
	'binaryClassifierType': classifiers.Winnow,
	'binaryClassifierOptions': {
		promotion: 1.5,
		demotion: 0.5,
		retrain_count: 10,
	},
});

var explain=4;

function show(input) {
	var classification = classifier.classify(input, explain);
	var classes = explain? classification.classes: classification;
	console.log("\t"+JSON.stringify(input)+" is "+classes);  
	if (explain)
		console.dir(classification);
}

classifier.trainBatch([
	{input: {I:true, want:true, a:true}, output: ['A']},
	{input: {I:true, want:true, b:true}, output: ['B']},
	{input: {I:true, want:true, c:true}, output: ['C']},
]);

console.log("Classify the training set (single class per sample):");
show({I:true, want:true, a:true});
show({I:true, want:true, b:true});
show({I:true, want:true, c:true});

console.log("Classify two classes per sample:");
show({I:true, want:true, a:true, and:true, b:true});
show({I:true, want:true, b:true, and:true, c:true});
show({I:true, want:true, c:true, and:true, a:true});

console.log("Classify three classes per sample:");
show({I:true, want:true, a:true, ",":true, b:true, and:true, c:true});

console.log("Classify no classes per sample:");
show({I:true, want:true, nothing:true});

console.log("Multi-Label Classification demo end");
