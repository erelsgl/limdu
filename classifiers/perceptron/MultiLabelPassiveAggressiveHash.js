var hash = require("../../utils/hash");
var sprintf = require("sprintf").sprintf;
var _ = require("underscore")._;
var CSRMatrix = require("csr-matrix");



/**
 * MultiLabelPassiveAggressive - Multilabel online classifier based on Perceptron and Passive-Aggressive.
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
	this.num_iterations = 0
}

MultiLabelPassiveAggressive.prototype = {

	/** 
	 * @param sample a hash of feature-values (string features)
	 * @param averaging boolean 
	 * @return an array of pairs [category,score], sorted by decreasing score
	 */
	predict: function(sample, averaging) {
		var scores = (averaging? 
			hash.multiply_scalar(
				hash.inner_product_matrix(sample, this.weights_sum), 
				1.0 / this.num_iterations):
			hash.inner_product_matrix(sample, this.weights)
			);  // scores is a map: category=>score
		
		var scores_vector = _.pairs(scores); // scores_vector is an array of pairs [category,score]
		scores_vector.sort(function(a,b) {return b[1]-a[1]}); // sort by decreasing score
		return scores_vector; 
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
			
			hash.addtimes(this.weights[r], tau, sample);  // weights[r] += tau*sample
			hash.addtimes(this.weights[s], -tau, sample); // weights[s] -= tau*sample
		}
		// this.weights_sum = (this.weights + this.weights_sum);
		for (category in this.weights)
			hash.add(this.weights_sum[category], this.weights[category]);
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
		var self=this;
		dataset.forEach(function(datum) {
			self.addClasses(datum.output);
		});

		for (var i=0; i<this.retrain_count; ++i)
			dataset.forEach(function(datum) {
				self.update(datum.input, datum.output);
			});
	},
	
	trainOnline: function(sample, classes) {
		this.addClasses(classes);
		this.update(sample, classes);
	},

	/**
	 * Use the model trained so far to classify a new sample.
	 * 
	 * @param sample a document.
	 * @param explain - int - if positive, an "explanation" field, with the given length, should be added to the result.
	 *  
	 * @return an array whose VALUES are classes.
	 */
	classify : function(sample, explain) {
		var ranks = this.predict(sample, /*averaging=*/true);
		var results = [];
		ranks.forEach(function(pair) {
			if (pair[1]>0)
				results.push(pair[0]);
		});
		return explain?
			{classification: results, explanation: "no explanation yet"}: 
			results; 
	},

	/**
	 * Tell the classifier that the given classes will be used for the following
	 * samples, so that it will know to add negative samples to classes that do
	 * not appear.
	 * 
	 * @param classes an array whose VALUES are classes.
	 */
	addClasses: function(classes) {
		var self=this;
		classes.forEach(function(theClass) {
			if (!(theClass in self.weights)) {
				self.weights[theClass]={};
				self.weights_sum[theClass]={};
			}
		});
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


var stringifyClass = function (aClass) {
	return (_(aClass).isString()? aClass: JSON.stringify(aClass));
}

var normalizeClasses = function (classes) {
	if (classes instanceof Array)
		classes = classes.map(stringifyClass);
	else 
		classes = stringifyClass(classes);
	return hash.normalized(classes);
}

module.exports = MultiLabelPassiveAggressive;
