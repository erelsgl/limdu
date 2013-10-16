var hash = require("../../utils/hash");
var FeaturesUnit = require("../../features");
var sprintf = require("sprintf").sprintf;
var _ = require("underscore")._;

/**
 * BinarySegmentation - Multi-label text classifier, based on a segmentation scheme using base binary classifiers.
 *
 * Inspired by:
 *
 * Morbini Fabrizio, Sagae Kenji. Joint Identification and Segmentation of Domain-Specific Dialogue Acts for Conversational Dialogue Systems. ACL-HLT 2011
 * http://www.citeulike.org/user/erelsegal-halevi/article/10259046
 *
 * @author Erel Segal-haLevi
 * 
 * @param opts
 *            binaryClassifierType (mandatory) - the type of the base binary classifier. 
 *            featureExtractor (optional) - a single feature-extractor (see the "features" folder), or an array of extractors, for extracting features from the text segments during classification.
 */
var BinarySegmentation = function(opts) {
	if (!('binaryClassifierType' in opts)) {
		console.dir(opts);
		throw new Error("opts must contain binaryClassifierType");
	}
	if (!opts.binaryClassifierType) {
		console.dir(opts);
		throw new Error("opts.binaryClassifierType is null");
	}
	this.binaryClassifierType = opts.binaryClassifierType;
	this.featureExtractor = FeaturesUnit.normalize(opts.featureExtractor);
	
	switch (opts.segmentSplitStrategy) {
	case 'shortestSegment': this.segmentSplitStrategy = this.shortestSegmentSplitStrategy; break;
	case 'longestSegment':  this.segmentSplitStrategy = this.longestSegmentSplitStrategy;  break;
	case 'cheapestSegment':  this.segmentSplitStrategy = this.cheapestSegmentSplitStrategy;  break;
	default: this.segmentSplitStrategy = null;
	}
	
	this.mapClassnameToClassifier = {};
}

BinarySegmentation.prototype = {
	
	getAllClasses: function() {
		return Object.keys(this.mapClassnameToClassifier);
	},

	/**
	 * Tell the classifier that the given sample belongs to the given classes.
	 * 
	 * @param sample
	 *            a document.
	 * @param classes
	 *            an object whose KEYS are classes, or an array whose VALUES are classes.
	 */
	trainOnline: function(sample, classes) {
		sample = this.sampleToFeatures(sample, this.featureExtractor);
		classes = hash.normalized(classes);
		for (var positiveClass in classes) {
			this.makeSureClassifierExists(positiveClass);
			this.mapClassnameToClassifier[positiveClass].trainOnline(sample, 1);
		}
		for (var negativeClass in this.mapClassnameToClassifier) {
			if (!classes[negativeClass])
				this.mapClassnameToClassifier[negativeClass].trainOnline(sample, 0);
		}
	},

	/**
	 * Train the classifier with all the given documents.
	 * 
	 * @param dataset
	 *            an array with objects of the format: 
	 *            {input: sample1, output: [class11, class12...]}
	 */
	trainBatch : function(dataset) {
		// this variable will hold a dataset for each binary classifier:
		var mapClassnameToDataset = {}; 

		// create positive samples for each class:
		for ( var i = 0; i < dataset.length; ++i) {
			dataset[i].features = this.sampleToFeatures(dataset[i].input, this.featureExtractor);
			dataset[i].output = hash.normalized(dataset[i].output);

			var sample = dataset[i].features;
			var classes = dataset[i].output;
			for (var positiveClass in classes) {  // the current sample is a positive example for each of the classes in its set
				this.makeSureClassifierExists(positiveClass);
				if (!(positiveClass in mapClassnameToDataset)) // make sure dataset for this class exists
					mapClassnameToDataset[positiveClass] = [];
				mapClassnameToDataset[positiveClass].push({
					input : sample,
					output : 1
				});
			}
		}

		// create negative samples for each class (after all classes are in the array):
		for ( var i = 0; i < dataset.length; ++i) {
			var sample = dataset[i].features;
			var classes = dataset[i].output;
			for (var negativeClass in this.mapClassnameToClassifier) { // the current sample is a negative example for each of the classes NOT in its set
				if (!(negativeClass in mapClassnameToDataset)) // make sure dataset for this class exists
					mapClassnameToDataset[negativeClass] = [];
				if (!classes[negativeClass])
					mapClassnameToDataset[negativeClass].push({
						input : sample,
						output : 0
					})
			}
		}

		// train all classifiers:
		for (var aClass in mapClassnameToDataset) {
			this.mapClassnameToClassifier[aClass]
					.trainBatch(mapClassnameToDataset[aClass]);
		}
	},

	/**
	 * Internal function - use the model trained so far to classify a single segment of a sentence.
	 * 
	 * @param segment a part of a text sentence.
	 * @param explain - int - if positive, an "explanation" field, with the given length, will be added to the result.
	 *  
	 * @return an array whose VALUES are classes.
	 */
	classifySegment: function(segment, explain) {
		var classes = {};
		sample = this.sampleToFeatures(segment, this.featureExtractor);
		if (explain>0) var positive_explanations = {}, negative_explanations = {};
		for (var aClass in this.mapClassnameToClassifier) {
			var classifier = this.mapClassnameToClassifier[aClass];
			var classification = classifier.classify(sample, explain);
			if (classification.explanation) {
				var explanations_string = classification.explanation.reduce(function(a,b) {
					return a + " " + sprintf("%s%+1.2f",b.feature,b.relevance);
				}, "");
				if (classification.classification > 0.5) {
					classes[aClass] = true;
					if (explain>0) positive_explanations[aClass]=explanations_string;
				} else {
					if (explain>0) negative_explanations[aClass]=explanations_string;
				}
			} else {
				if (classification > 0.5)
					classes[aClass] = true;
			}
		}
		classes = Object.keys(classes);
		return (explain>0?
			{
				classes: classes, 
				explanation: {
					positive: positive_explanations,
					negative: negative_explanations
				}
			}:
			classes);
	},

	/**
	 * Internal function - use the model trained so far to classify a single segment of a sentence.
	 * 
	 * @param segment a part of a text sentence.
	 * @param explain - int - if positive, an "explanation" field, with the given length, will be added to the result.
	 *  
	 * @return an array [the_best_class, and_its_probability].
	 */
	bestClassOfSegment: function(segment) {
		var classes = this.classifySegment(segment);
		if (classes.length==0) {
			return [null, 0];
		} else {
			return [classes[0], 1 / classes.length];
		}
	},
	
	
	/**
	 * protected function:
	 * Strategy of finding the cheapest segmentation (- most probable segmentation), using a dynamic programming algorithm.
	 * Based on: 
	 * Morbini Fabrizio, Sagae Kenji. Joint Identification and Segmentation of Domain-Specific Dialogue Acts for Conversational Dialogue Systems. ACL-HLT 2011
 	 * http://www.citeulike.org/user/erelsegal-halevi/article/10259046
	 */
	cheapestSegmentSplitStrategy: function(words, accumulatedClasses, explain, explanations) {
		
		// Calculate the cost of classification of the segment from i to j.
		// (Cost = - log probability).
		var segmentClassificationCosts = [];  // best cost to classify segment [i,j]
		for (var start=0; start<=words.length; ++start) {
			segmentClassificationCosts[start] = [];
			for (var end=0; end<start; ++end)
				segmentClassificationCosts[start][end]=Infinity;
			segmentClassificationCosts[start][start]=0;
			for (var end=start+1; end<=words.length; ++end) {
				var segment = words.slice(start,end).join(" ");
				var bestClassAndProbability = this.bestClassOfSegment(segment);
				//console.log(segment+" - "+bestClassAndProbability);
				var bestClass = bestClassAndProbability[0];
				var bestClassProbability = bestClassAndProbability[1];
				segmentClassificationCosts[start][end] = -Math.log(bestClassProbability);
			}
		}
		//console.log("segmentClassificationCosts");		console.dir(segmentClassificationCosts);
		var cheapest_paths = require("../../../graph-paths/graph-paths").cheapest_paths;
		cheapestSegmentClassificationCosts = cheapest_paths(segmentClassificationCosts, 0);
		cheapestSentenceClassificationCost = cheapestSegmentClassificationCosts[words.length];
		if (!cheapestSentenceClassificationCost)
			throw new Error("cheapestSegmentClassificationCosts["+words.length+"] is empty");
		
		var cheapestClassificationPath = cheapestSentenceClassificationCost.path;
		explanations.push(cheapestSentenceClassificationCost);
		for (var i=0; i<cheapestClassificationPath.length-1; ++i) {
			var segment = words.slice(cheapestClassificationPath[i],cheapestClassificationPath[i+1]).join(" ");
			var segmentClassesWithExplain = this.classifySegment(segment, explain);
			var segmentClasses = (segmentClassesWithExplain.classes? segmentClassesWithExplain.classes: segmentClassesWithExplain);
			//console.log(segment+": "+segmentClasses);
			for (var j in segmentClasses) {
				accumulatedClasses[segmentClasses[j]]=true;
			}
			if (explain>0) {
				explanations.push(segment);
				explanations.push(segmentClassesWithExplain.explanation);
			};
			
		}
	},
	
	/**
	 * protected function:
	 * Strategy of classifying the shortest segments with a single class.
	 */
	shortestSegmentSplitStrategy: function(words, accumulatedClasses, explain, explanations) {
		var currentStart = 0;
		for (var currentEnd=1; currentEnd<=words.length; ++currentEnd) {
			var segment = words.slice(currentStart,currentEnd).join(" ");
			var segmentClassesWithExplain = this.classifySegment(segment, explain);
			var segmentClasses = (segmentClassesWithExplain.classes? segmentClassesWithExplain.classes: segmentClassesWithExplain);

			if (segmentClasses.length==1) {
				// greedy algorithm: found a section with a single class - cut it and go on
				accumulatedClasses[segmentClasses[0]]=true;
				currentStart = currentEnd;
				if (explain>0) {
					explanations.push(segment);
					explanations.push(segmentClassesWithExplain.explanation);
				};
			}
		}
	},

	
	/**
	 * protected function:
	 * Strategy of classifying the longest segments with a single class.
	 */
	longestSegmentSplitStrategy: function(words, accumulatedClasses, explain, explanations) {
		var currentStart = 0;
		var segment = null;
		var segmentClassesWithExplain = null;
		var segmentClasses = null;
		for (var currentEnd=1; currentEnd<=words.length; ++currentEnd) {
			var nextSegment = words.slice(currentStart,currentEnd).join(" ");
			var nextSegmentClassesWithExplain = this.classifySegment(nextSegment, explain);
			var nextSegmentClasses = (nextSegmentClassesWithExplain.classes? nextSegmentClassesWithExplain.classes: nextSegmentClassesWithExplain);
			//console.log("\t"+JSON.stringify(nextSegment) +" -> "+nextSegmentClasses)
			nextSegmentClasses.sort();

			if (segmentClasses && segmentClasses.length==1 && (nextSegmentClasses.length>1 || !_(nextSegmentClasses).isEqual(segmentClasses))) {
				// greedy algorithm: found a section with a single class - cut it and go on
				accumulatedClasses[segmentClasses[0]]=true;
				currentStart = currentEnd-1;
				if (explain>0) {
					explanations.push(segment);
					explanations.push(segmentClassesWithExplain.explanation);
				};
			}

			segment = nextSegment;
			segmentClassesWithExplain = nextSegmentClassesWithExplain;
			segmentClasses = nextSegmentClasses;
		}
		
		// add the classes of the last section:
		for (var i in segmentClasses) 
			accumulatedClasses[segmentClasses[i]]=true;
		if (explain>0) {
			explanations.push(segment);
			explanations.push(segmentClassesWithExplain.explanation);
		};
		/*if (words.length>20)  {
			console.dir(explanations);
			process.exit(1);
		}*/
	},

	/**
	 * Use the model trained so far to classify a new sample.
	 * 
	 * @param segment a part of a text sentence.
	 * @param explain - int - if positive, an "explanation" field, with the given length, will be added to the result.
	 *  
	 * @return an array whose VALUES are classes.
	 */
	classify: function(sentence, explain) {
		var minWordsToSplit = 2;
		var words = sentence.split(/ /);
		if (this.segmentSplitStrategy && words.length>=minWordsToSplit) {
			var accumulatedClasses = {};
			var explanations = [];
			this.segmentSplitStrategy(words, accumulatedClasses, explain, explanations); 
			// this is either this.shortestSegmentSplitStrategy, or this.longestSegmentSplitStrategy
			
			var classes = Object.keys(accumulatedClasses);
			return (explain>0?	{
				classes: classes, 
				explanation: explanations
			}: 
			classes);
		} else {
			return this.classifySegment(sentence, explain);
		}
	},

	toJSON : function(callback) {
		var result = {};
		for ( var aClass in this.mapClassnameToClassifier) {
			var binaryClassifier = this.mapClassnameToClassifier[aClass];
			if (!binaryClassifier.toJSON) {
				console.dir(binaryClassifier);
				console.log("prototype: ");
				console.dir(binaryClassifier.__proto__);
				throw new Error("this binary classifier does not have a toJSON function");
			}
			result[aClass] = binaryClassifier.toJSON(callback);
		}
		return result;
	},

	fromJSON : function(json, callback) {
		for ( var aClass in json) {
			this.mapClassnameToClassifier[aClass] = new this.binaryClassifierType();
			this.mapClassnameToClassifier[aClass].fromJSON(json[aClass]);
		}
	},
	
	// private function: 
	makeSureClassifierExists: function(aClass) {
		if (!this.mapClassnameToClassifier[aClass]) { // make sure classifier exists
			this.mapClassnameToClassifier[aClass] = new this.binaryClassifierType();
		}
	},
	
	// private function: 
	sampleToFeatures: function(sample, featureExtractor) {
		var features = sample;
		if (featureExtractor) {
			try {
				features = featureExtractor(sample);
			} catch (err) {
				throw new Error("Cannot extract features from '"+JSON.stringify(sample)+"': "+JSON.stringify(err));
			}
		}
		return features;
	},
}

module.exports = BinarySegmentation;
