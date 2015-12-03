# Limdu.js

Limdu is a machine-learning framework for Node.js. It supports **multi-label classification**, **online learning**, and **real-time classification**. Therefore, it is especially suited for natural language understanding in dialog systems and chat-bots.

Limdu is in an "alpha" state - some parts are working (see this readme), but some parts are missing or not tested. Contributions are welcome. 

Limdu currently runs on Node.js 12 and later versions.

## Installation

	npm install limdu

## Demos

You can run the demos from this project: [limdu-demo](https://github.com/erelsgl/limdu-demo).

**Table of Contents**  *generated with [DocToc](http://doctoc.herokuapp.com/)*

- [Binary Classification](#binary-classification)
	- [Batch Learning - learn from an array of input-output pairs:](#batch-learning---learn-from-an-array-of-input-output-pairs)
	- [Online Learning](#online-learning)
	- [Binding](#binding)
	- [Explanations](#explanations)
	- [Other Binary Classifiers](#other-binary-classifiers)
- [Multi-Label Classification](#multi-label-classification)
	- [Other Multi-label classifiers](#other-multi-label-classifiers)
- [Feature engineering](#feature-engineering)
	- [Feature extraction - converting an input sample into feature-value pairs:](#feature-extraction---converting-an-input-sample-into-feature-value-pairs)
	- [Input Normalization](#input-normalization)
	- [Feature lookup table - convert custom features to integer features](#feature-lookup-table---convert-custom-features-to-integer-features)
- [Serialization](#serialization)
- [Cross-validation](#cross-validation)
- [Back-classification (aka Generation)](#back-classification-aka-generation)
- [SVM wrappers](#svm-wrappers)
- [Undocumented featuers](#undocumented-featuers)
- [Contributions](#contributions)
- [License](#license)

## Binary Classification

### Batch Learning - learn from an array of input-output pairs:

	var limdu = require('limdu');
	
	var colorClassifier = new limdu.classifiers.NeuralNetwork();
	
	colorClassifier.trainBatch([
		{input: { r: 0.03, g: 0.7, b: 0.5 }, output: 0},  // black
		{input: { r: 0.16, g: 0.09, b: 0.2 }, output: 1}, // white
		{input: { r: 0.5, g: 0.5, b: 1.0 }, output: 1}   // white
		]);
	
	console.log(colorClassifier.classify({ r: 1, g: 0.4, b: 0 }));  // 0.99 - almost white

Credit: this example uses [brain.js, by Heather Arthur](https://github.com/harthur/brain).


### Online Learning

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

Credit: this example uses Modified Balanced Margin Winnow ([Carvalho and Cohen, 2006](http://www.citeulike.org/user/erelsegal-halevi/article/2243777)). 

The "explanation" feature is explained below.


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


### Explanations

Some classifiers can return "explanations" - additional information that explains how the classification result has been derived: 

	var colorClassifier = new limdu.classifiers.Bayesian();
	
	colorClassifier.trainBatch([
		{input: { r: 0.03, g: 0.7, b: 0.5 }, output: 'black'}, 
		{input: { r: 0.16, g: 0.09, b: 0.2 }, output: 'white'},
		{input: { r: 0.5, g: 0.5, b: 1.0 }, output: 'white'},
		]);
	
	console.log(colorClassifier.classify({ r: 1, g: 0.4, b: 0 }, 
			/* explanation level = */1));

Credit: this example uses code from [classifier.js, by Heather Arthur](https://github.com/harthur/classifier).

The explanation feature is experimental and is supported differently for different classifiers. For example, for the Bayesian classifier it returns the probabilities for each category:

	{ classes: 'white',
		explanation: [ 'white: 0.0621402182289608', 'black: 0.031460948468170505' ] }

While for the winnow classifier it returns the relevance (feature-value times feature-weight) for each feature: 

	{ classification: 1,
		explanation: [ 'bias+1.12', 'r+1.08', 'g+0.25', 'b+0.00' ] }

WARNING: The internal format of the explanations might change without notice. The explanations should be used for presentation purposes only (and not, for example, for extracting the actual numbers). 

### Other Binary Classifiers

In addition to Winnow and NeuralNetwork, version 0.2 includes the following binary classifiers:

* Bayesian - uses [classifier.js, by Heather Arthur](https://github.com/harthur/classifier). 
* Perceptron - Loosely based on [perceptron.js, by John Chesley](https://github.com/chesles/perceptron).
* SVM - uses [svm.js, by Andrej Karpathy](https://github.com/karpathy/svmjs). 
* Linear SVM - wrappers around SVM-Perf and Lib-Linear (see below).
* Decision Tree - based on [node-decision-tree-id3 by Ankit Kuwadekar](https://github.com/bugless/nodejs-decision-tree-id3) or [ID3-Decision-Tree by Will Kurt](https://github.com/willkurt/ID3-Decision-Tree).

This library is still under construction, and not all features work for all classifiers. For a full list of the features that do work, see the "test" folder. 


## Multi-Label Classification

In binary classification, the output is 0 or 1;

In multi-label classification, the output is a set of zero or more labels.

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

* Cross-Lingual Language Model Classifier (based on [Anton Leusky and David Traum, 2008](http://www.citeulike.org/user/erelsegal-halevi/article/12540655))
* HOMER - Hierarchy Of Multi-label classifiERs (based on [Tsoumakas et al., 2007](http://www.citeulike.org/user/erelsegal-halevi/article/3170786))
* Meta-Labeler (based on [Lei Tang, Suju Rajan, Vijay K. Narayanan, 2009](http://www.citeulike.org/user/erelsegal-halevi/article/4860265)) 
* Joint identification and segmentation (based on [Fabrizio Morbini, Kenji Sagae, 2011](http://www.citeulike.org/user/erelsegal-halevi/article/10259046))
* Passive-Aggressive (based on [Koby Crammer, Ofer Dekel, Joseph Keshet, Shai Shalev-Shwartz, Yoram Singer, 2006](http://www.citeulike.org/user/erelsegal-halevi/article/5960770))
* Threshold Classifier (converting multi-class classifier to multi-label classifier by finding the best appropriate threshold)

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
	console.dir(intentClassifier.classify("I WANT AN APPLE AND A BANANA"));  // []
	
As you can see from the last example, by default feature extraction is case-sensitive. 
We will take care of this in the next example.

Instead of defining your own feature extractor, you can use those already bundled with limdu:

	limdu.features.NGramsOfWords
	limdu.features.NGramsOfLetters
	limdu.features.HypernymExtractor

You can also make 'featureExtractor' an array of several feature extractors, that will be executed in the order you include them.

### Input Normalization

	//Initialize a classifier with a feature extractor and a case normalizer:
	intentClassifier = new limdu.classifiers.EnhancedClassifier({
		classifierType: TextClassifier,  // same as in previous example
		normalizer: limdu.features.LowerCaseNormalizer,
		featureExtractor: WordExtractor  // same as in previous example
	});

	//Train and test:
	intentClassifier.trainBatch([
		{input: "I want an apple", output: "apl"},
		{input: "I want a banana", output: "bnn"},
		{input: "I want chips", output: "cps"},
		]);
	
	console.dir(intentClassifier.classify("I want an apple and a banana"));  // ['apl','bnn']
	console.dir(intentClassifier.classify("I WANT AN APPLE AND A BANANA"));  // ['apl','bnn'] 

Of course you can use any other function as an input normalizer. For example, if you know how to write a spell-checker, you can create a normalizer that corrects typos in the input.

You can also make 'normalizer' an array of several normalizers. These will be executed in the order you include them.

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
		featureExtractor: limdu.features.NGramsOfWords(1),  // each word ("1-gram") is a feature  
		featureLookupTable: new limdu.features.FeatureLookupTable()
	});
	
	// Train and test:
	intentClassifier.trainBatch([
		{input: "I want an apple", output: "apl"},
		{input: "I want a banana", output: "bnn"},
		{input: "I want chips", output: "cps"},
		]);
	
	console.dir(intentClassifier.classify("I want an apple and a banana"));  // ['apl','bnn']

The FeatureLookupTable takes care of the numbers, while you may continue to work with texts! 

## Serialization

Say you want to train a classifier on your home computer, and use it on a remote server. To do this, you should somehow convert the trained classifier to a string, send the string to the remote server, and deserialize it there.

You can do this with the "serialization.js" package:

	npm install serialization
	
On your home machine, do the following:

	var serialize = require('serialization');
	
	// First, define a function that creates a fresh  (untrained) classifier.
	// This code should be stand-alone - it should include all the 'require' statements
	//   required for creating the classifier.
	function newClassifierFunction() {
		var limdu = require('limdu');
		var TextClassifier = limdu.classifiers.multilabel.BinaryRelevance.bind(0, {
			binaryClassifierType: limdu.classifiers.Winnow.bind(0, {retrain_count: 10})
		});
	
		var WordExtractor = function(input, features) {
			input.split(" ").forEach(function(word) {
				features[word]=1;
			});
		};
		
		// Initialize a classifier with a feature extractor:
		return new limdu.classifiers.EnhancedClassifier({
			classifierType: TextClassifier,
			featureExtractor: WordExtractor,
			pastTrainingSamples: [], // to enable retraining
		});
	}
	
	// Use the above function for creating a new classifier:
	var intentClassifier = newClassifierFunction();
	
	// Train and test:
	var dataset = [
		{input: "I want an apple", output: "apl"},
		{input: "I want a banana", output: "bnn"},
		{input: "I want chips", output: "cps"},
		];
	intentClassifier.trainBatch(dataset);
	
	console.log("Original classifier:");
	intentClassifier.classifyAndLog("I want an apple and a banana");  // ['apl','bnn']
	intentClassifier.trainOnline("I want a doughnut", "dnt");
	intentClassifier.classifyAndLog("I want chips and a doughnut");  // ['cps','dnt']
	intentClassifier.retrain();
	intentClassifier.classifyAndLog("I want an apple and a banana");  // ['apl','bnn']
	intentClassifier.classifyAndLog("I want chips and a doughnut");  // ['cps','dnt']
	
	// Serialize the classifier (convert it to a string)
	var intentClassifierString = serialize.toString(intentClassifier, newClassifierFunction);
	
	// Save the string to a file, and send it to a remote server.


On the remote server, do the following:
	
	// retrieve the string from a file and then:
	
	var intentClassifierCopy = serialize.fromString(intentClassifierString, __dirname);
	
	console.log("Deserialized classifier:");
	intentClassifierCopy.classifyAndLog("I want an apple and a banana");  // ['apl','bnn']
	intentClassifierCopy.classifyAndLog("I want chips and a doughnut");  // ['cps','dnt']
	intentClassifierCopy.trainOnline("I want an elm tree", "elm");
	intentClassifierCopy.classifyAndLog("I want doughnut and elm tree");  // ['dnt','elm']

CAUTION: Serialization was not tested for all possible combinations of classifiers and enhancements. Test well before use!

## Cross-validation

	// create a dataset with a lot of input-output pairs:
	var dataset = [ ... ];
	
	// Decide how many folds you want in your   k-fold cross-validation:
	var numOfFolds = 5;

	// Define the type of classifier that you want to test:
	var IntentClassifier = limdu.classifiers.EnhancedClassifier.bind(0, {
		classifierType: limdu.classifiers.multilabel.BinaryRelevance.bind(0, {
			binaryClassifierType: limdu.classifiers.Winnow.bind(0, {retrain_count: 10})
		}),
		featureExtractor: limdu.features.NGramsOfWords(1),
	});
	
	var microAverage = new limdu.utils.PrecisionRecall();
	var macroAverage = new limdu.utils.PrecisionRecall();
	
	limdu.utils.partitions.partitions(dataset, numOfFolds, function(trainSet, testSet) {
		console.log("Training on "+trainSet.length+" samples, testing on "+testSet.length+" samples");
		var classifier = new IntentClassifier();
		classifier.trainBatch(trainSet);
		limdu.utils.test(classifier, testSet, /* verbosity = */0,
			microAverage, macroAverage);
	});
	
	macroAverage.calculateMacroAverageStats(numOfFolds);
	console.log("\n\nMACRO AVERAGE:"); console.dir(macroAverage.fullStats());
	
	microAverage.calculateStats();
	console.log("\n\nMICRO AVERAGE:"); console.dir(microAverage.fullStats());


## Back-classification (aka Generation)

Use this option to get the list of all samples with a given class.

	var intentClassifier = new limdu.classifiers.EnhancedClassifier({
		classifierType: limdu.classifiers.multilabel.BinaryRelevance.bind(0, {
			binaryClassifierType: limdu.classifiers.Winnow.bind(0, {retrain_count: 10})
		}),
		featureExtractor: limdu.features.NGramsOfWords(1),
		pastTrainingSamples: [],
	});
	
	// Train and test:
	intentClassifier.trainBatch([
		{input: "I want an apple", output: "apl"},
		{input: "I want a banana", output: "bnn"},
		{input: "I really want an apple", output: "apl"},
		{input: "I want a banana very much", output: "bnn"},
		]);
	
	console.dir(intentClassifier.backClassify("apl"));  // [ 'I want an apple', 'I really want an apple' ]


## SVM wrappers

The native svm.js implementation takes a lot of time to train -  quadratic in the number of training samples. 
There are two common packages that can be trained in time linear in the number of training samples. They are:

* [SVM-Perf](http://www.cs.cornell.edu/people/tj/svm_light/svm_perf.html) - by Thorsten Joachims;
* [LibLinear](http://www.csie.ntu.edu.tw/~cjlin/liblinear) - Fan, Chang, Hsieh, Wang and Lin.

The limdu.js package provides wrappers for these implementations. 
In order to use the wrappers, you must have the binary file used for training in your path, that is:

* **svm\_perf\_learn** - from [SVM-Perf](http://www.cs.cornell.edu/people/tj/svm_light/svm_perf.html).
* **liblinear\_train** - from [LibLinear](http://www.csie.ntu.edu.tw/~cjlin/liblinear).

Once you have any one of these installed, you can use the corresponding classifier instead of any binary classifier
used in the previous demos, as long as you have a feature-lookup-table. For example, with SvmPerf:

	var intentClassifier = new limdu.classifiers.EnhancedClassifier({
		classifierType: limdu.classifiers.multilabel.BinaryRelevance.bind(0, {
			binaryClassifierType: limdu.classifiers.SvmPerf.bind(0, 	{
				learn_args: "-c 20.0" 
			})
		}),
		featureExtractor: limdu.features.NGramsOfWords(1),
		featureLookupTable: new limdu.features.FeatureLookupTable()
	});

and similarly with SvmLinear.

See the files classifiers/svm/SvmPerf.js and classifiers/svm/SvmLinear.js for a documentation of the options.


## Undocumented featuers

Some advanced features are working but not documented yet. If you need any of them, open an issue and I will try to document them.

* Custom input normalization, based on regular expressions.
* Input segmentation for multi-label classification - both manual (with regular expressions) and automatic.
* Feature extraction for model adaptation.
* Spell-checker features. 
* Hypernym features.
* Classification based on a cross-lingual language model.
* Format conversion - ARFF, JSON, svm-light, TSV.

## License

LGPL

## Contributions

Code contributions are welcome. Reasonable pull requests, with appropriate documentation and unit-tests, will be accepted.

Do you like limdu? Remember that you can star it :-)
