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

var explain=0;

function show(input) {
	var classification = classifier.classify(input, explain);
	var classes = explain? classification.classes: classification;
	console.log("\t"+JSON.stringify(input)+" is "+classes);  
	if (explain)
		console.dir(classification);
}

function createAndShow1(activeClasses) {
	var input = {I:true, want:true, and:true, ",":true};
	activeClasses.forEach(function(theClass) {
		input[theClass]= true;
	});
	show(input);
}

function createAndShow(activeClasses) {
	console.log(activeClasses.map(function(x){return x+":1.0 "}).join("")+ "7:1.0 8:1.0 9:1.0 ");
}

//var classes = ['A','B','C','D','E','F','G'];
var classes = ['0','1','2','3','4','5','6'];
var dataset = classes.map(function(theClass) {
	var input = {I:true, want:true, and:true};
	input[theClass] = true;
	var sample = {input: input, output: [theClass]};
	return sample;
});

classifier.trainBatch(dataset);

console.log("Classify no classes per sample:");
show({I:true, want:true, nothing:true});

console.log("Classify the training set (single class per sample):");
classes.forEach(function(theClass) {
	createAndShow([theClass]);
});

console.log("Classify two classes per sample:");
classes.forEach(function(theClass, index) {
	createAndShow([theClass, classes[(index+1)%classes.length]]);
});

console.log("Classify three classes per sample:");
classes.forEach(function(theClass, index) {
	createAndShow([theClass, classes[(index+1)%classes.length], classes[(index+2)%classes.length]]);
});

console.log("Classify four classes per sample:");
classes.forEach(function(theClass, index) {
	createAndShow([theClass, classes[(index+1)%classes.length], classes[(index+2)%classes.length], classes[(index+3)%classes.length]]);
});

console.log("Classify five classes per sample:");
classes.forEach(function(theClass, index) {
	createAndShow([theClass, classes[(index+1)%classes.length], classes[(index+2)%classes.length], classes[(index+3)%classes.length], classes[(index+4)%classes.length]]);
});

console.log("Classify six classes per sample:");
classes.forEach(function(theClass, index) {
	createAndShow([theClass, classes[(index+1)%classes.length], classes[(index+2)%classes.length], classes[(index+3)%classes.length], classes[(index+4)%classes.length], classes[(index+5)%classes.length]]);
});

console.log("Classify all classes:");
createAndShow(classes);

console.log("Multi-Label Classification demo end");
