var hash = require("../../utils/hash");
// var FeaturesUnit = require("../../features");
var sprintf = require("sprintf").sprintf;
var _ = require("underscore")._;
var ftrs = require('../../features');

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
	this.classifier = new this.binaryClassifierType();
	this.strandard = opts.strandard;

	switch (opts.segmentSplitStrategy) {
	case 'shortestSegment': this.segmentSplitStrategy = this.shortestSegmentSplitStrategy; break;
	case 'longestSegment':  this.segmentSplitStrategy = this.longestSegmentSplitStrategy;  break;
	case 'cheapestSegment':  this.segmentSplitStrategy = this.cheapestSegmentSplitStrategy;  break;
	default: this.segmentSplitStrategy = null;
	}
	
	this.mapClassnameToClassifier = {};
}

BinarySegmentation.prototype = {
	
	/* Tell the classifier that the given sample belongs to the given classes.
	 * 
	 * @param sample
	 *            a document.
	 * @param classes
	 *            an object whose KEYS are classes, or an array whose VALUES are classes.
	 */
	trainOnline: function(sample, classes) {
		sample = this.sampleToFeatures(sample, this.featureExtractors);
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
		this.classifier.trainBatch(dataset)
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
			var classification = this.classifier.classify(segment, 30, true);
			// if (classification.classes.length != 0)
			{
				//HERE
				// console.log(segment)
				// console.log(classification)
				// console.log(classification['explanation']['positive'])
				// console.log(classification['explanation']['negative']['With leased car'])
				// console.log(classification['explanation']['negative']['10%'])
			}


			// if ((segment == "Leased car")&&('With leased car' in classification['explanation']['negative']))
				{
				// console.log(classification['explanation']['negative']['With leased car'])
				// console.log("______________________________________")
				// process.exit(0)

				}
			return classification
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
		var classes = this.classifySegment(segment, 6);
		if (classes.classes.length==0) {
			return [null, 0];
		} else {
			// HERE
			// console.log([classes.classes[0], classes.scores[classes.classes[0]]])
			return [classes.classes[0], classes.scores[classes.classes[0]]];
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
			// for (var end=0; end<start; ++end)
			for (var end=0; end<=words.length; ++end)
				segmentClassificationCosts[start][end]=Infinity;
				// segmentClassificationCosts[start][end] = 0
			segmentClassificationCosts[start][start]=0;
			for (var end=start+1; end<=words.length; ++end) {
				var segment = words.slice(start,end).join(" ");
				// console.log(segment)
				var bestClassAndProbability = this.bestClassOfSegment(segment);
				if (bestClassAndProbability[1] != Infinity)
				{
					var bestClass = bestClassAndProbability[0];
					var bestClassProbability = bestClassAndProbability[1];
					// segmentClassificationCosts[start][end] = -Math.log(bestClassProbability)
					segmentClassificationCosts[start][end] = -bestClassProbability
				}
			}
		}
		var cheapest_paths = require("../../node_modules/graph-paths/graph-paths").cheapest_paths;
		
		// if (this.standard == false)
		// {
		var mini = Infinity
		_(words.length).times(function(nn){
			cheapestSegmentClassificationCosts = cheapest_paths(segmentClassificationCosts, nn);
			//HERE
			// console.log(cheapestSegmentClassificationCosts)
			// console.log("_")
			_.each(cheapestSegmentClassificationCosts, function(value, key, list){ 
				if (value.cost<mini)
				{
				mini = value.cost
				cheapestSentenceClassificationCost = value
				}
			}, this)
		}, this)
		// }
		// else
		// {
			// cheapestSegmentClassificationCosts = cheapest_paths(segmentClassificationCosts, 0);
			// cheapestSentenceClassificationCost = cheapestSegmentClassificationCosts[words.length];

		// }
		// cheapestSentenceClassificationCost = cheapestSegmentClassificationCosts[words.length];
		if (!cheapestSentenceClassificationCost)
			throw new Error("cheapestSegmentClassificationCosts["+words.length+"] is empty");
		
		var cheapestClassificationPath = cheapestSentenceClassificationCost.path;
		// explanations.push(cheapestSentenceClassificationCost);
		for (var i=0; i<cheapestClassificationPath.length-1; ++i) {
			var segment = words.slice(cheapestClassificationPath[i],cheapestClassificationPath[i+1]).join(" ");
			var segmentClassesWithExplain = this.classifySegment(segment, explain);
			var segmentClasses = (segmentClassesWithExplain.classes? segmentClassesWithExplain.classes: segmentClassesWithExplain);
			// console.log(segment+": "+segmentClasses);

			for (var j in segmentClasses) {
				accumulatedClasses[segmentClasses[j]]=true;
			}

			// explanations = []
			if (explain>0) {
				_.each(segmentClasses, function(clas, key, list){ 
					explanations.push([clas, segment, [cheapestClassificationPath[i], cheapestClassificationPath[i+1]]])

				}, this)
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
		// explain = 5
		// console.log("sentece"+sentence)
		var minWordsToSplit = 2;
		var words = sentence.split(/ /);
		if (this.segmentSplitStrategy && words.length>=minWordsToSplit) {
			var accumulatedClasses = {};
			var explanations = [];
			this.segmentSplitStrategy(words, accumulatedClasses, explain, explanations); 
			
			var classes = Object.keys(accumulatedClasses);
			// console.log(classes)
			return (explain>0?	{
				classes: classes, 
				explanation: explanations
			}: 
			classes);
		} else {
			classification = this.bestClassOfSegment(sentence)
			// console.log(classification)
			// classification = this.classifySegment(sentence, explain);
			return (explain>0?	{
				classes: classification[0], 
				explanation: [[classification[0], sentence, [0,sentence.length-1]]]

			}: 
			classification[0]);
			// return {classes: classification[0],
					// explanation: [[classification[0], sentence, [0,sentence.length-1]]]}
			// return {classes: classification.classes[0]}
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
	
	setFeatureLookupTable: function(featureLookupTable) {
		if (featureLookupTable) 
			// this.featureLookupTable = featureLookupTable
			if (this.classifier.setFeatureLookupTable)
				this.classifier.setFeatureLookupTable(featureLookupTable);  // for generating clearer explanations only
		// }
 	},
}

module.exports = BinarySegmentation;
