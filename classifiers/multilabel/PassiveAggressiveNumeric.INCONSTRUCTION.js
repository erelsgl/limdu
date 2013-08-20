var hash = require("../utils/hash");
var sprintf = require("sprintf").sprintf;
var _ = require("underscore")._;
var CSRMatrix = require("csr-matrix");



/**
 * MultiLabelPassiveAggressive - Multilabel online classifier based on Perceptron and Passive-Aggressive.
 *
 * features and categories are numeric; samples are vectors.
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
}

MultiLabelPassiveAggressive.prototype = {

	/** 
	 * @param sample a vector of feature-values (numeric features)
	 * @param averaging boolean 
	 * @return an array of pairs [category_index,score], sorted by decreasing score
	 */
	predict: function(sample, averaging) {
		var scores = (averaging? 
			this.weights_sum.apply(sample) / this.num_iterations:
			this.weights.apply(sample));  // scores is now a Float64Array

		//return sorted(enumerate(scores_vector), key=lambda x: x[1], reverse=True);
		var scores_vector = _.pairs(scores); // scores_vector is an array of pairs [category_index,score]
		scores_vector.sort(function(a,b) {return b[1]-a[1]});  // sort by decreasing score
		return scores_vector; 
	},
	
	/**
	 * Tell the classifier that the given sample belongs to the given classes.
	 * 
	 * @param sample a vector of feature-values (numeric features)
	 * @param classes an array whose VALUES are classes.
	 */
	update: function(sample, classes) {
		var classesSet = _(classes).invert();

		var ranks = this.predict(sample, /*averaging=*/false);  // tuples of [class,score] sorted by decreasing score:

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
		}

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
			var sample_norm2 = sample.transpose().dot(sample)[0, 0];
			var tau = Math.min(this.Constant, loss/sample_norm2);
			
			var Tau = CSRMatrix.fromList([], this.num_categories, 1);
			Tau[r, 0] = tau;
			Tau[s, 0] = -tau;
			// Tau is a vector with only two nonzero elements: row r and row s. 
			
			this.weights = this.weights + Tau * sample.transpose();
				// this.weights[r] += tau * sample
				// this.weights[s] -= tau * sample
		}
		this.weights_sum = (this.weights + this.weights_sum);
		//hash.add(this.weights_sum, this.weights);
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
		var num_features = dataset[0].input.length;
		var num_categories = dataset[0].output.length; // TODO: this is incorrect!
		this.num_iterations = 0

		this.weights = CSRMatrix.fromList([], num_categories, num_features)
		this.weights_sum = CSRMatrix.fromList([], num_categories, num_features)

		for (var i=0; i<this.retrain_count; ++i)
			dataset.forEach(function(datum) {
				this.update(datum.input, datum.output);
			});
	},
	
	trainOnline: function(sample, classes) {
		
	}

	/**
	 * Use the model trained so far to classify a new sample.
	 * 
	 * @param sample a document.
	 *  
	 * @return an array whose VALUES are classes.
	 */
	classify : function(sample) {
		return this.predict(sample, /*averaging=*/true);
	},

	/**
	 * Tell the classifier that the given classes will be used for the following
	 * samples, so that it will know to add negative samples to classes that do
	 * not appear.
	 * 
	 * @param classes
	 *			an object whose KEYS are classes, or an array whose VALUES are
	 *			classes.
	 */
	addClasses: function(classes) {
		classes = normalizeClasses(classes);
		for ( var aClass in classes) {
			if (!this.mapClassnameToClassifier[aClass]) {
				this.mapClassnameToClassifier[aClass] = new this.binaryClassifierType(
					this.binaryClassifierOptions);
			}
		}
	},
	
	getAllClasses: function() {
		return Object.keys(this.mapClassnameToClassifier);
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
