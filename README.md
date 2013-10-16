# Limdu

Limdu is a machine-learning framework for Node.js, which supports online learning and multi-label classification.


## Installation

	npm install limdu

## Binary classification

### online learning

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

### batch learning

This example uses the neural network implementation [brain.js, by Heather Arthur](https://github.com/harthur/brain).

	var limdu = require('limdu');
	
	var colorClassifier = new limdu.classifiers.NeuralNetwork();
	
	colorClassifier.trainBatch([
		{input: { r: 0.03, g: 0.7, b: 0.5 }, output: 0},  // black
		{input: { r: 0.16, g: 0.09, b: 0.2 }, output: 1}, // white
		{input: { r: 0.5, g: 0.5, b: 1.0 }, output: 1},   // white
		]);
	
	console.log(colorClassifier.classify({ r: 1, g: 0.4, b: 0 }));  // 0.99 - white
	
	console.log("limdu demo end");
	

## Multi-label Classification

[TODO]


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
