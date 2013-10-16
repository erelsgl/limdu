var hash = require("../../utils/hash");
var FeaturesUnit = require("../../features");
var sprintf = require("sprintf").sprintf;
var _ = require("underscore")._;

/**
 * MulticlassSegmentation - Multi-label text classifier, based on a segmentation scheme using a base multi-class classifier.
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
var MulticlassSegmentation = function(opts) {
	if (!opts.multiclassClassifierType) {
		console.dir(opts);
		throw new Error("opts.multiclassClassifierType not found");
	}
	this.multiclassClassifierType = opts.multiclassClassifierType;
	this.featureExtractor = FeaturesUnit.normalize(opts.featureExtractor);
	
	this.multiclassClassifier = new this.multiclassClassifierType();
}

MulticlassSegmentation.prototype = {

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
		var category = (Array.isArray(classes)? classes[0]: classes);
		this.multiclassClassifier.trainOnline(sample, category);
		/*for (var positiveClass in classes) {
			this.makeSureClassifierExists(positiveClass);
			this.mapClassnameToClassifier[positiveClass].trainOnline(sample, 1);
		}
		for (var negativeClass in this.mapClassnameToClassifier) {
			if (!classes[negativeClass])
				this.mapClassnameToClassifier[negativeClass].trainOnline(sample, 0);
		}*/
	},

	/**
	 * Train the classifier with all the given documents.
	 * 
	 * @param dataset
	 *            an array with objects of the format: 
	 *            {input: sample1, output: [class11, class12...]}
	 */
	trainBatch : function(dataset) {
		for ( var i = 0; i < dataset.length; ++i) {
			dataset[i] = {
				input: this.sampleToFeatures(dataset[i].input, this.featureExtractor),
				output: (Array.isArray(dataset[i].output)? dataset[i].output[0]: dataset[i].output)
			};
		}
		
		this.multiclassClassifier.trainBatch(dataset);
	},

	/**
	 * Internal function - use the model trained so far to classify a single segment of a sentence.
	 * 
	 * @param segment a part of a text sentence.
	 * @param explain - int - if positive, an "explanation" field, with the given length, will be added to the result.
	 *  
	 * @return {category: xxx, probability: yyy}
	 */
	classifySegment: function(segment, explain) {
		var sample = this.sampleToFeatures(segment, this.featureExtractor);
		return this.multiclassClassifier.classify(sample, explain);
	},

	/**
	 * @param segment a part of a text sentence.
	 * @return {category: best_category_of_segment, probability: its_probability}
	 */
	bestClassOfSegment: function(segment) {
		var sample = this.sampleToFeatures(segment, this.featureExtractor);
		var classification = this.multiclassClassifier.classify(sample, 1);
		//console.log(segment+": ");	console.dir(classification)
		return classification;
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
				var classification = this.bestClassOfSegment(segment);
				segmentClassificationCosts[start][end] = -Math.log(classification.probability);
			}
		}
		//console.log(words+":  ");		console.log("segmentClassificationCosts");		console.dir(segmentClassificationCosts);
		var cheapest_paths = require("graph-paths").cheapest_paths;
		cheapestSegmentClassificationCosts = cheapest_paths(segmentClassificationCosts, 0);
		cheapestSentenceClassificationCost = cheapestSegmentClassificationCosts[words.length];
		if (!cheapestSentenceClassificationCost)
			throw new Error("cheapestSegmentClassificationCosts["+words.length+"] is empty");
		//console.log("cheapestSentenceClassificationCost");		console.dir(cheapestSentenceClassificationCost);
		
		var cheapestClassificationPath = cheapestSentenceClassificationCost.path;
		explanations.push(cheapestSentenceClassificationCost);
		for (var i=0; i<cheapestClassificationPath.length-1; ++i) {
			var segment = words.slice(cheapestClassificationPath[i],cheapestClassificationPath[i+1]).join(" ");
			//console.log(segment+":  ");
			var segmentCategoryWithExplain = this.classifySegment(segment, explain);
			//console.dir(segmentCategoryWithExplain);
			var segmentCategory = (segmentCategoryWithExplain.category? segmentCategoryWithExplain.category: segmentCategoryWithExplain);
			accumulatedClasses[segmentCategory]=true;
			if (explain>0) {
				explanations.push(segment);
				explanations.push(segmentCategoryWithExplain.explanation);
			};
		}
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
		if (words.length>=minWordsToSplit) {
			var accumulatedClasses = {};
			var explanations = [];
			this.cheapestSegmentSplitStrategy(words, accumulatedClasses, explain, explanations); 
			
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

	toJSON : function() {
		return this.multiclassClassifier.toJSON();
	},

	fromJSON : function(json) {
		this.multiclassClassifier.fromJSON(json);
	},
	
	// private function: 
	sampleToFeatures: function(sample, featureExtractor) {
		var features = sample;
		if (featureExtractor) {
			try {
				features = {};
				featureExtractor(sample, features);
			} catch (err) {
				throw new Error("Cannot extract features from '"+JSON.stringify(sample)+"': "+JSON.stringify(err));
			}
		}
		return features;
	},
}

module.exports = MulticlassSegmentation;
