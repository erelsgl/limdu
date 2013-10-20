// simple demonstration of Binary Relevance (one-vs.-all) classifier

var classifiers = require('..');

var trainSet = [
		{input: {'I':1,'want':1,'aa':1}, output: 'a'},
		{input: {'I':1,'want':1,'bb':1}, output: 'b'},
		{input: {'I':1,'want':1,'cc':1}, output: 'c'},
		];

var classifier = new classifiers.multilabel.BinaryRelevance({
	binaryClassifierType: classifiers.Winnow.bind(0,{retrain_count:10})
});
classifier.trainBatch(trainSet);

console.log("simple classification: ");
console.dir(classifier.classify({'I':1,'want':1,'aa':1}));  // a
console.dir(classifier.classify({'I':1,'need':1,'bb':1}));  // b
console.dir(classifier.classify({'I':1,'feel':1,'cc':1}));  // c
console.dir(classifier.classify({'I':1,'need':1,'aa':1,'bb':1}));  // a,b

//console.log("model: ");
//console.dir(classifier);

console.log("explained classification: ");
console.dir(classifier.classify({'I':1,'want':1,'aa':1},5));  // a
console.dir(classifier.classify({'I':1,'need':1,'bb':1},5));  // b
console.dir(classifier.classify({'I':1,'feel':1,'cc':1},5));  // c
console.dir(classifier.classify({'I':1,'need':1,'aa':1,'bb':1},5));  // a,b

console.log("classification with scores: ");
console.dir(classifier.classify({'I':1,'need':1,'aa':1},0,true));  // a
console.dir(classifier.classify({'I':1,'need':1,'bb':1},0,true));  // b
console.dir(classifier.classify({'I':1,'need':1,'cc':1},0,true));  // c
console.dir(classifier.classify({'I':1,'need':1,'aa':1,'bb':1},0,true));  // a,b

console.log("explained classification with scores: ");
console.dir(classifier.classify({'I':1,'need':1,'aa':1},5,true));  // a
console.dir(classifier.classify({'I':1,'need':1,'bb':1},5,true));  // b
console.dir(classifier.classify({'I':1,'need':1,'cc':1},5,true));  // c
console.dir(classifier.classify({'I':1,'need':1,'aa':1,'bb':1},5,true));  // a,b
