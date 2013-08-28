/**
 * A version of Modified Balanced Winnow (Carvalho and Cohen, 2006)
 *    where the weights vector is a hash (not a numeric array), 
 *    so the features can be any objects (not just nubmers).
 * @author Erel Segal-haLevi
 * @since 2013-06-03
 * 
 * @param opts optional parameters: <ul>
 *	<li>debug 
 *  <li>default_positive_weight, default_negative_weight: default weight for a newly discovered feature (default = 2, 1).
 *  <li>promotion, demotion, threshold, margin - explained in the paper.
 *  <li>retrain_count - number of times to retrain in batch mode. Default = 0 (no retrain).
 *  <li>continuous_output (boolean) - if true, return a classification between 0 and 1. I false, return binary output - 0 or 1. 
 */
 
var hash = require("../../utils/hash");
var sprintf = require("sprintf").sprintf;  // for explanations

function WinnowHash(opts) {
	if (!opts) opts = {}

	this.debug = opts.debug || false; 
		
	// Default values are based on Carvalho and Cohen, 2006, section 4.2:	
	this.default_positive_weight = opts.default_positive_weight || 2.0;
	this.default_negative_weight = opts.default_negative_weight || 1.0;
	this.do_averaging = opts.do_averaging || false;
	this.do_normalization = opts.do_normalization || true;
	this.threshold = opts.threshold || 1;
	this.promotion = opts.promotion || 1.5;
	this.demotion = opts.demotion || 0.5;
	this.margin = opts.margin || 1.0;
	this.retrain_count = opts.retrain_count || 0;
	this.continuous_output = opts.continuous_output || false;
		
	this.positive_weights = {};
	this.negative_weights = {};
	this.positive_weights_sum = {};   // for averaging; count only weight vectors with successful predictions (Carvalho and Cohen, 2006).
	this.negative_weights_sum = {};   // for averaging; count only weight vectors with successful predictions (Carvalho and Cohen, 2006).
}


WinnowHash.prototype = {
		
		toJSON: function(folder) {
			return {
				positive_weights: this.positive_weights,
				negative_weights: this.negative_weights,
				positive_weights_sum: this.positive_weights_sum,
				negative_weights_sum: this.negative_weights_sum,
			}
		},

		fromJSON: function(json) {
			this.positive_weights = json.positive_weights;
			this.positive_weights_sum = json.positive_weights_sum;
			this.negative_weights = json.negative_weights;
			this.negative_weights_sum = json.negative_weights_sum;
		},
		
		normalized_features: function (features, remove_unknown_features) {
			if (!('bias' in features))
				features['bias'] = 1;
			if (remove_unknown_features) {
				for (var feature in features)
					if (!(feature in this.positive_weights))
						delete features[feature];
			} 
			if (this.do_normalization) 
				hash.normalize_sum_of_values_to_1(features);
			return features;
		},

		/**
		 * @param inputs a SINGLE training sample; a hash (feature => value).
		 * @param expected the classification value for that sample (0 or 1)
		 * @return true if the input sample got its correct classification (i.e. no change made).
		 */
		train_features: function(features, expected) {
			if (this.debug) console.log("train_features "+JSON.stringify(features)+" , "+expected);
			for (feature in features) {
				if (!(feature in this.positive_weights)) 
					this.positive_weights[feature] = this.default_positive_weight;
				if (!(feature in this.negative_weights)) 
					this.negative_weights[feature] = this.default_negative_weight;
			}

			if (this.debug) console.log('> features',features,' this.positive_weights ',this.positive_weights,', this.negative_weights: ',this.negative_weights);

			var score = this.perceive_features(features, /*continuous_output=*/true, this.positive_weights, this.negative_weights);
				 // always use the running 'weights' vector for training, and NOT the weights_sum!

			if (this.debug) console.log('> training ',features,', expecting: ',expected, ' got score=', score);
			
			if ((expected && score<=this.margin) || (!expected && score>=-this.margin)) {
				// Current model is incorrect - adjustment needed!
				if (this.debug) console.log('> adjusting weights...');
				if (expected) {
					for (var feature in features) {
						var value = features[feature]; 
						this.positive_weights[feature] *= (this.promotion * (1 + value));
						this.negative_weights[feature] *= (this.demotion * (1 - value));
					}
				} else {
					for (var feature in features) { 
						var value = features[feature]; 
						this.positive_weights[feature] *= (this.demotion * (1 - value));
						this.negative_weights[feature] *= (this.promotion * (1 + value));
					}
				}
				if (this.debug) console.log(' -> new weights:', this.positive_weights, this.negative_weights);
				return false;
			} else {
				if (this.do_averaging) {
					hash.add(this.positive_weights_sum, this.positive_weights);
					hash.add(this.negative_weights_sum, this.negative_weights);
				}
				return true;
			}
		},

		/**
		 * train online (a single instance).
		 *
		 * @param features a SINGLE training sample (a hash of feature-value pairs).
		 * @param expected the classification value for that sample (0 or 1).
		 * @return true if the input sample got its correct classification (i.e. no change made).
		 */
		trainOnline: function(features, expected) {
			return this.train_features(
				this.normalized_features(features, /*remove_unknown_features=*/false), expected);
		},

		/**
		 * Batch training (a set of samples). Uses the option this.retrain_count.
		 *
		 * @param dataset an array of samples of the form {input: {feature1: value1...} , output: 0/1} 
		 */
		trainBatch: function(dataset) {
			var normalized_inputs = [];
			for (var i=0; i<dataset.length; ++i)
				normalized_inputs[i] = this.normalized_features(dataset[i].input, /*remove_unknown_features=*/false);
	
			for (var r=0; r<=this.retrain_count; ++r)
				for (var i=0; i<normalized_inputs.length; ++i) 
					this.train_features(normalized_inputs[i], dataset[i].output);
		},
		

		/**
		 * @param inputs a SINGLE sample; a hash (feature => value).
		 * @param continuous_output if true, return the net classification score. If false [default], return 0 or 1.
		 * @param explain - int - if positive, an "explanation" field, with the given length, will be added to the result.  
		 * @param positive_weights_for_classification, negative_weights_for_classification -
		  the weights vector to use (either the running 'weights' or 'weights_sum').  
		 * @return the classification of the sample.
		 */
		perceive_features: function(features, continuous_output, positive_weights_for_classification, negative_weights_for_classification, explain) {
			var score = 0;
			if (explain>0) var explanations = [];
			for (var feature in features) {
				if (feature in positive_weights_for_classification) {
					var positive_weight = positive_weights_for_classification[feature];
					var negative_weight = negative_weights_for_classification[feature];
					var net_weight = positive_weight-negative_weight;
					var relevance = features[feature] * net_weight;
					score += relevance;
					if (explain>0) explanations.push({
						feature: feature,
						value: features[feature],
						weight: sprintf("+%1.3f-%1.3f=%1.3f",positive_weight,negative_weight,net_weight),
						relevance: relevance,
						toString: function() { return sprintf("%s%+1.2f",feature,relevance); }
					});
				}
			}
			score -= this.threshold;
			if (isNaN(score)) throw new Error("score is NaN! positive_score="+positive_score+" negative_score="+negative_score+" this.threshold="+this.threshold);

			if (this.debug) console.log("> perceive_features ",features," = ",score);
			var result = (continuous_output? score: (score > 0 ? 1 : 0));
			if (explain) {
				explanations.sort(function(a,b){return Math.abs(b.relevance)-Math.abs(a.relevance)});
				explanations.splice(explain, explanations.length-explain);  // "explain" is the max length of explanation.
				
				result = {
					classification: result,
					explanation: explanations,
					threshold: -this.threshold,
					net_score: score, 
				}
			}
			return result;
		},

		/**
		 * @param inputs a SINGLE sample (a hash of feature-value pairs).
		 * @param continuous_output if true, return the net classification value. If false [default], return 0 or 1.
		 * @param explain - int - if positive, an "explanation" field, with the given length, will be added to the result.  
		 * @return the classification of the sample.
		 */
		perceive: function(features, continuous_output, explain) {
			return this.perceive_features(this.normalized_features(features, /*remove_unknown_features=*/true), continuous_output,
				(this.do_averaging? this.positive_weights_sum: this.positive_weights),
				(this.do_averaging? this.negative_weights_sum: this.negative_weights),
				explain );
		},
		

		/**
		 * @param inputs - a feature-value hash.
		 * @param explain - int - if positive, an "explanation" field, with the given length, will be added to the result.  
		 * @return the binary classification - 0 or 1.
		 */
		classify: function(features, explain) {
			return this.perceive(features, this.continuous_output, explain);
		},
}

module.exports = WinnowHash;

