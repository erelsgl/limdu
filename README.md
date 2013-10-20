# Limdu

Limdu is a machine-learning framework for Node.js, which supports online learning and multi-label classification.

## Installation

	npm install limdu

## Demos

Demos can be found at [limdu-demo](https://github.com/erelsgl/limdu-demo).

## Binary Classification

### Batch Learning

This example uses [brain.js, by Heather Arthur](https://github.com/harthur/brain).

	var limdu = require('limdu');
	
	var colorClassifier = new limdu.classifiers.NeuralNetwork();
	
	colorClassifier.trainBatch([
		{input: { r: 0.03, g: 0.7, b: 0.5 }, output: 0},  // black
		{input: { r: 0.16, g: 0.09, b: 0.2 }, output: 1}, // white
		{input: { r: 0.5, g: 0.5, b: 1.0 }, output: 1}   // white
		]);
	
	console.log(colorClassifier.classify({ r: 1, g: 0.4, b: 0 }));  // 0.99 - almost white


### Online Learning; Explanations

This example uses Modified Balanced Margin Winnow ([Carvalho and Cohen, 2006](http://www.citeulike.org/user/erelsegal-halevi/article/2243777)):

	var limdu = require('limdu');
	
	var birdClassifier = new limdu.classifiers.Winnow({
		default_positive_weight: 1,
		default_negative_weight: 1,
		threshold: 0
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
		threshold: 0
	});
	
	var birdClassifier = new MyWinnow();
	...
	// continue as above


### Other Binary Classifiers

In addition to Winnow and NeuralNetwork, version 0.2 includes the following binary classifiers:

* Bayesian - uses [classifier.js, by Heather Arthur](https://github.com/harthur/classifier). 
* Perceptron
* SVM - uses [svm.js, by Andrej Karpathy](https://github.com/karpathy/svmjs). 
* Linear SVM - wrappers around SVM-Perf and Lib-Linear (see below).

This library is still under construction, and not all features work for all classifiers. For a full list of the features that do work, see the "test" folder. 


## Multi-Label Classification

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

### Other Multi-label classifiers

In addition to BinaryRelevance, version 0.2 includes the following multi-label classifier types (see the multilabel folder):

* HOMER - Hierarchy Of Multi-label classifiERs ([Tsoumakas et al., 2007](http://www.citeulike.org/user/erelsegal-halevi/article/3170786))
* Passive-Aggressive ([Koby Crammer, Ofer Dekel, Joseph Keshet, Shai Shalev-Shwartz, Yoram Singer, 2006](http://www.citeulike.org/user/erelsegal-halevi/article/5960770))
 

This library is still under construction, and not all features work for all classifiers. For a full list of the features that do work, see the "test" folder. 

## Feature engineering

### Feature extraction - converting an input sample into feature-value pairs:

	// First, define our base classifier type (a multi-label classifier based on winnow):
	var TextClassifier = limdu.classifiers.multilabel.BinaryRelevance.bind(0, {
		binaryClassifierType: limdu.classifiers.Winnow.bind(0, {retrain_count: 10})
	});
	
	// Now define our feature extractor - a function that takes a sample and adds features to a given features set:
	var WordExtractor = function(input, features) {
		input.split(" ").forEach(function(word) {
			features[word]=1;
		});
	};
	
	// Initialize a classifier with the base classifier type and the feature extractor:
	var intentClassifier = new limdu.classifiers.EnhancedClassifier({
		classifierType: TextClassifier,
		featureExtractor: WordExtractor
	});
	
	// Train and test:
	intentClassifier.trainBatch([
		{input: "I want an apple", output: "apl"},
		{input: "I want a banana", output: "bnn"},
		{input: "I want chips", output:    "cps"},
		]);
	
	console.dir(intentClassifier.classify("I want an apple and a banana"));  // ['apl','bnn']
	console.dir(intentClassifier.classify("I WANT AN APPLE AND A BANANA"));  // [] (note: feature extraction is case sensitive)

Some simple feature extractors are already bundled with limdu:

	limdu.features.NGramsFromText
	limdu.features.HypernymExtractor

### Input Normalization

	//Initialize a classifier with a feature extractor and a case normalizer:
	intentClassifier = new limdu.classifiers.EnhancedClassifier({
		classifierType: TextClassifier,  // same as in previous example
		normalizer: limdu.features.LowerCaseNormalizer,    // a custom normalization function
		featureExtractor: WordExtractor  // same as in previous example
	});

	//Train and test:
	intentClassifier.trainBatch([
		{input: "I want an apple", output: "apl"},
		{input: "I want a banana", output: "bnn"},
		{input: "I want chips", output: "cps"},
		]);
	
	console.dir(intentClassifier.classify("I want an apple and a banana"));  // ['apl','bnn']
	console.dir(intentClassifier.classify("I WANT AN APPLE AND A BANANA"));  // ['apl','bnn'] (case insensitive)


### Feature lookup table - convert custom features to integer features

This example uses the quadratic SVM implementation [svm.js, by Andrej Karpathy](https://github.com/karpathy/svmjs). 
This SVM (like most SVM implementations) works with integer features, so we need a way to convert our string-based features to integers.

	var limdu = require('limdu');
	
	// First, define our base classifier type (a multi-label classifier based on svm.js):
	var TextClassifier = limdu.classifiers.multilabel.BinaryRelevance.bind(0, {
		binaryClassifierType: limdu.classifiers.SvmJs.bind(0, {C: 1.0})
	});

	// Initialize a classifier with a feature extractor and a lookup table:
	var intentClassifier = new limdu.classifiers.EnhancedClassifier({
		classifierType: TextClassifier,
		featureExtractor: limdu.features.NGramsFromText(1),  // each word ("1-gram") is a feature  
		featureLookupTable: new limdu.features.FeatureLookupTable()
	});
	
	// Train and test:
	intentClassifier.trainBatch([
		{input: "I want an apple", output: "apl"},
		{input: "I want a banana", output: "bnn"},
		{input: "I want chips", output: "cps"},
		]);
	
	console.dir(intentClassifier.classify("I want an apple and a banana"));  // ['apl','bnn']


## Serialization

[TODO]


## Cross-validation

[TODO]


## SVM wrappers

[TODO]

## Contributions

Contributions are more than welcome! All reasonable pull requests, with appropriate unit-tests, will be accepted.

## License

LGPL

