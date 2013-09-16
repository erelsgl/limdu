var hash = require("../../utils/hash");
var sprintf = require("sprintf").sprintf;
var _ = require("underscore")._;
var util = require("util");
var multilabelutils = require('./multilabelutils');



/**
 * Multilabel online classifier based on Perceptron and Passive-Aggressive.
 *
 * features and categories are strings; samples are hashes.
 *
 * Based on Python code Copyright (c) 2013 Joseph Keshet.
 *
 * Conversion to Node.js started by Erel Segal-haLevi, but not finished yet.
 *
 * @since 2013-08
 * 
 * @param opts
 *			Constant (optional) - tradeoff constant (default=5.0)
 *			retrain_count (optional) - number of epoches to run in trainBatch mode (default=10)  
 */
var MultiLabelPassiveAggressive = function(opts) {
	this.retrain_count = opts.retrain_count || 10;
	this.Constant = opts.Constant || 5.0;
	this.weights = {
		//DUMMY_CLASS:{}
	};
	this.weights_sum = {
		//DUMMY_CLASS:{}
	};
	this.seenFeatures = {};
	this.num_iterations = 0
}

MultiLabelPassiveAggressive.prototype = {

	/** 
	 * @param sample a hash of feature-values (string features)
	 * @param averaging boolean 
	 * @return an array of pairs [category,score], sorted by decreasing score
	 */
	predict: function(features, averaging, explain) {
		var weights_for_classification = (averaging? this.weights_sum: this.weights);
		var scores = {};
		if (explain>0) var explanations = [];
		
//		for (var feature in features) {
//			if (feature in weights_for_classification) {
//				var weight = weights_for_classification[feature];
//				var value = features[feature];
//				var relevance = value * weight;
//				score += relevance;
//				if (explain>0) explanations.push(this.detailed_explanations?
//						{
//							feature: feature,
//							value: value,
//							weight: weight,
//							relevance: relevance,
//						}:
//						sprintf("%s%+1.2f*%+1.2f=%+1.2f", feature, value, weight, relevance);
//				);
//			}
//		}
		
		scores = hash.inner_product_matrix(features, weights_for_classification); // scores is a map: category=>score
		var scoresVector = _.pairs(scores); // scoresVector is an array of pairs [category,score]
		scoresVector.sort(function(a,b) {return b[1]-a[1]}); // sort by decreasing score
		return scoresVector; 
	},
	
	/**
	 * Tell the classifier that the given sample belongs to the given classes.
	 * 
	 * @param sample a hash of feature-values (string features)
	 * @param classes an array whose VALUES are classes.
	 */
	update: function(sample, classes) {
		var classesSet = hash.normalized(classes);

		var ranks = this.predict(sample, /*averaging=*/false);  // pairs of [class,score] sorted by decreasing score

		// find the lowest ranked relevant label r:
		var r = 0
		var r_score = Number.MAX_VALUE
		ranks.forEach(function(labelAndScore) {
			var label = labelAndScore[0];
			var score = labelAndScore[1];
			if ((label in classesSet) && score < r_score) {
				r = label
				r_score = score
			}
		});

		// find the highest ranked irrelevant label s
		var s = 0
		var s_score = -Number.MAX_VALUE
		ranks.reverse();
		ranks.forEach(function(labelAndScore) {
			var label = labelAndScore[0];
			var score = labelAndScore[1];
			if (!(label in classesSet) && score > s_score) {
				s = label;
				s_score = score;
			}
		});

		var loss = Math.max(1.0 - r_score, 0.0) + Math.max(1.0 + s_score, 0.0);
		if (loss > 0) {
			var sample_norm2 = hash.sum_of_square_values(sample);
			var tau = Math.min(this.Constant, loss / sample_norm2);

			if (r_score < Number.MAX_VALUE)
				hash.addtimes(this.weights[r], tau, sample);  // weights[r] += tau*sample
			if (s_score > -Number.MAX_VALUE)
				hash.addtimes(this.weights[s], -tau, sample); // weights[s] -= tau*sample
		}
		// this.weights_sum = (this.weights + this.weights_sum);
		for (category in this.weights)
			hash.add(this.weights_sum[category], this.weights[category]);
		
		hash.add(this.seenFeatures, sample);
		this.num_iterations += 1;
	},

	/**
	 * Train the classifier with all the given documents.
	 * 
	 * @param dataset
	 *			an array with objects of the format: 
	 *			{input: sample1, output: [class11, class12...]}
	 */
	trainBatch : function(dataset) {
		// preprocessing: add all the classes in the dataset to the weights vector;
		dataset.forEach(function(datum) {
			this.addClasses(datum.output);
			this.editFeatureValues(datum.input, /*remove_unknown_features=*/false);
		}, this);

		for (var i=0; i<this.retrain_count; ++i)
			dataset.forEach(function(datum) {
				this.update(datum.input, datum.output);
			}, this);
	},
	
	trainOnline: function(features, classes) {
		this.addClasses(classes);
		this.editFeatureValues(features, /*remove_unknown_features=*/false);
		this.update(features, classes);
	},

	/**
	 * Use the model trained so far to classify a new sample.
	 * 
	 * @param sample a hash {feature1: value1, feature2: value2, ...}.
	 * @param explain - int - if positive, an "explanation" field, with the given length, should be added to the result.
	 * @param withScores - boolean - if true, return an array of [class,score], ordered by decreasing order of score.
	 *  
	 * @return an array whose VALUES are classes.
	 */
	classify : function(features, explain, withScores) {
		this.editFeatureValues(features, /*remove_unknown_features=*/true);
		var scoresVector = this.predict(features, /*averaging=*/true, explain);
		return multilabelutils.mapScoresVectorToMultilabelResult(scoresVector, explain, withScores, /*threshold=*/0);
	},

	
	/**
	 * Copied from Modified Balanced Winnow (see winnow/winnow_hash.js).
	 * Commented out, because it is unuseful here.
	 */
	editFeatureValues: function (features, remove_unknown_features) {
//		console.log("before: "+util.inspect(features));
//		if (!('bias' in features))
//			features['bias'] = 1.0;
//		if (remove_unknown_features) {
//			for (var feature in features)
//				if (!(feature in this.seenFeatures))
//					delete features[feature];
//		}
//		hash.normalize_sum_of_values_to_1(features);
//		console.log("after: "+util.inspect(features));
	},

	
	/**
	 * Tell the classifier that the given classes will be used for the following
	 * samples, so that it will know to add negative samples to classes that do
	 * not appear.
	 * 
	 * @param classes an object whose KEYS are classes, or an array whose VALUES are classes.
	 */
	addClasses: function(classes) {
		classes = hash.normalized(classes);
		for (var aClass in classes) {
			if (!(aClass in this.weights)) {
				this.weights[aClass]={};
				this.weights_sum[aClass]={};
			}
		}
	},

	getAllClasses: function() {
		return Object.keys(this.weights);
	},

	toJSON : function(callback) {
		return {
			weights_sum: this.weights_sum,
			weights: this.weights,
			num_iterations: this.num_iterations,
		}
	},

	fromJSON : function(json, callback) {
		this.weights_sum = json.weights_sum;
		this.weights = json.weights;
		this.num_iterations = json.num_iterations;
	},
}


module.exports = MultiLabelPassiveAggressive;
