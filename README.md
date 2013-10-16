# Limdu

Limdu is a machine-learning framework for Node.js, which supports online learning and multi-label classification.


## Installation

	npm install limdu


## Binary classification

### Batch learning

This example uses the neural network implementation [brain.js, by Heather Arthur](https://github.com/harthur/brain).

	var limdu = require('limdu');
	
	var colorClassifier = new limdu.classifiers.NeuralNetwork();
	
	colorClassifier.trainBatch([
		{input: { r: 0.03, g: 0.7, b: 0.5 }, output: 0},  // black
		{input: { r: 0.16, g: 0.09, b: 0.2 }, output: 1}, // white
		{input: { r: 0.5, g: 0.5, b: 1.0 }, output: 1},   // white
		]);
	
	console.log(colorClassifier.classify({ r: 1, g: 0.4, b: 0 }));  // 0.99 - white


### Online learning

This example uses the Modified Balanced Margin Winnow classifier (Carvalho and Cohen, 2006):

	var limdu = require('limdu');
	
	var birdClassifier = new limdu.classifiers.Winnow({
		default_positive_weight: 1,
		default_negative_weight: 1,
		threshold: 0,
	});
	
	birdClassifier.trainOnline({'wings': 1, 'flight': 1, 'beak': 1, 'eagle': 1}, 1);  // eagle is a bird (1)
	birdClassifier.trainOnline({'wings': 0, 'flight': 0, 'beak': 0, 'dog': 1}, 0);    // dog is not a bird (0)
	console.dir(birdClassifier.classify({'wings': 1, 'flight': 0, 'beak': 0.5, 'penguin':1})); // initially, penguin is mistakenly classified as 0 - "not a bird"
	console.dir(birdClassifier.classify({'wings': 1, 'flight': 0, 'beak': 0.5, 'penguin':1}, /*explanation level=*/4)); // why? because it does not fly.

	birdClassifier.trainOnline({'wings': 1, 'flight': 0, 'beak': 1, 'penguin':1}, 1);  // learn that penguin is a bird, although it doesn't fly 
	birdClassifier.trainOnline({'wings': 0, 'flight': 1, 'beak': 0, 'bat': 1}, 0);     // learn that bat is not a bird, although it does fly
	console.dir(birdClassifier.classify({'wings': 1, 'flight': 0, 'beak': 1, 'chicken': 1})); // now, chicken is correctly classified as a bird, although it does not fly.  
	console.dir(birdClassifier.classify({'wings': 1, 'flight': 0, 'beak': 1, 'chicken': 1}, /*explanation level=*/4)); // why?  because it has wings and beak.


### Binding

Using Javascript's binding capabilities, it is possible to create custom classes, which are made of existing classes and pre-specified parameters:

	var MyWinnow = limdu.classifiers.Winnow.bind(0, {
		default_positive_weight: 1,
		default_negative_weight: 1,
		threshold: 0,
	});
	
	var birdClassifier = new MyWinnow();
	...
	// continue as above


## Multi-label Classification

	var MyWinnow = limdu.classifiers.Winnow.bind(0, {retrain_count: 10});

	var intentClassifier = new limdu.classifiers.multilabel.BinaryRelevance({
		binaryClassifierType: MyWinnow
	});
	
	intentClassifier.trainBatch([
		{input: {I:1,want:1,an:1,apple:1}, output: "APPLE"},
		{input: {I:1,want:1,a:1,banana:1}, output: "BANANA"},
		{input: {I:1,want:1,chips:1}, output: "CHIPS"}
		]);
	
	console.dir(intentClassifier.classify({I:1,want:1,an:1,apple:1,and:1,a:1,banana:1}));  // ['APPLE','BANANA']



## Feature extraction

[TODO]


## Input normalization

[TODO]


## Serialization

[TODO]


## Cross-validation

[TODO]


## SVM wrappers

[TODO]
