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
 *  <li>bias - constant (bias) factor (default: 1).
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
	this.threshold = ('threshold' in opts? opts.threshold: 1);
	this.promotion = opts.promotion || 1.5;
	this.demotion = opts.demotion || 0.5;
	this.margin = ('margin' in opts? opts.margin: 1.0);
	this.retrain_count = opts.retrain_count || 0;
	this.detailed_explanations = opts.detailed_explanations || false;
	
	this.bias = ('bias' in opts? opts.bias: 1.0);

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
			if (!json.positive_weights) throw new Error("No positive weights in json: "+JSON.stringify(json));
			this.positive_weights = json.positive_weights;
			this.positive_weights_sum = json.positive_weights_sum;
			if (!json.negative_weights) throw new Error("No negative weights in json: "+JSON.stringify(json));
			this.negative_weights = json.negative_weights;
			this.negative_weights_sum = json.negative_weights_sum;
		},
		
		editFeatureValues: function (features, remove_unknown_features) {
			if (this.bias && !('bias' in features))
				features['bias'] = 1;
			if (remove_unknown_features) {
				for (var feature in features)
					if (!(feature in this.positive_weights))
						delete features[feature];
			}
			hash.normalize_sum_of_values_to_1(features);
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

			if (this.debug) console.log('> this.positive_weights  ',JSON.stringify(this.positive_weights),', this.negative_weights: ',JSON.stringify(this.negative_weights));

			var score = this.perceive_features(features, /*continuous_output=*/true, this.positive_weights, this.negative_weights);
				 // always use the running 'weights' vector for training, and NOT the weights_sum!

			//if (this.debug) console.log('> training ',features,', expecting: ',expected, ' got score=', score);
			
			if ((expected && score<=this.margin) || (!expected && score>=-this.margin)) {
				// Current model is incorrect - adjustment needed!
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
				if (this.debug) console.log('--> this.positive_weights',JSON.stringify(this.positive_weights),', this.negative_weights: ',JSON.stringify(this.negative_weights));
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
			this.editFeatureValues(features, /*remove_unknown_features=*/false);
			return this.train_features(features, expected);
				//this.normalized_features(features, /*remove_unknown_features=*/false), expected);
		},

		/**
		 * Batch training (a set of samples). Uses the option this.retrain_count.
		 *
		 * @param dataset an array of samples of the form {input: {feature1: value1...} , output: 0/1} 
		 */
		trainBatch: function(dataset) {
//			var normalized_inputs = [];
			for (var i=0; i<dataset.length; ++i)
				this.editFeatureValues(dataset[i].input, /*remove_unknown_features=*/false);
//				normalized_inputs[i] = this.normalized_features(dataset[i].input, /*remove_unknown_features=*/false);
	
			for (var r=0; r<=this.retrain_count; ++r)
				for (var i=0; i<dataset.length; ++i) 
					this.train_features(dataset[i].input, dataset[i].output);
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
			var explanations = [];
			for (var feature in features) {
				if (feature in positive_weights_for_classification) {
					var positive_weight = positive_weights_for_classification[feature];
					if (!isFinite(positive_weight)) {
						console.dir(positive_weights_for_classification);
						throw new Error("positive_weight["+feature+"]="+positive_weight);
					}
					var negative_weight = negative_weights_for_classification[feature];
					if (!isFinite(negative_weight)) {
						console.dir(negative_weights_for_classification);
						throw new Error("negative_weight["+feature+"]="+negative_weight);
					}
					var net_weight = positive_weight-negative_weight;
					var value = features[feature];
					if (isNaN(value)) {
						console.dir(features);
						throw new Error("score is NaN! features["+feature+"]="+value+" net_weight="+positive_weight+"-"+negative_weight+"="+net_weight);
					}
					var relevance = value * net_weight;
					score += relevance;
					if (isNaN(score)) 
						throw new Error("score is NaN! features["+feature+"]="+value+" net_weight="+positive_weight+"-"+negative_weight+"="+net_weight);
					if (explain>0) explanations.push(
							{
								feature: feature,
								value: value,
								weight: sprintf("+%1.3f-%1.3f=%1.3f",positive_weight,negative_weight,net_weight),
								relevance: relevance,
							}
					);
				}
			}
			if (isNaN(score)) 
				throw new Error("score is NaN! features="+JSON.stringify(features));
			score -= this.threshold;

			if (this.debug) console.log("> perceive_features ",JSON.stringify(features)," = ",score);
			var result = (continuous_output? score: (score > 0 ? 1 : 0));
			if (explain>0) {
				explanations.sort(function(a,b){return Math.abs(b.relevance)-Math.abs(a.relevance); });
				explanations.splice(explain, explanations.length-explain);  // "explain" is the max length of explanation.
				
				if (!this.detailed_explanations) {
					explanations = explanations.map(function(e) {
						return sprintf("%s%+1.2f", e.feature, e.relevance);
					});
				}
				
				result = {
					classification: result,
					explanation: explanations,
				};
			}
			return result;
		},

		/**
		 * @param inputs a SINGLE sample (a hash of feature-value pairs).
		 * @param continuous_output if true, return the net classification value. If false [default], return 0 or 1.
		 * @param explain - int - if positive, an "explanation" field, with the given length, will be added to the result.  
		 * @return the classification of the sample.
		 */
		classify: function(features, explain, continuous_output) {
			this.editFeatureValues(features, /*remove_unknown_features=*/true);
			return this.perceive_features(
				//this.normalized_features(features, /*remove_unknown_features=*/true),
				features, 
				continuous_output,
				(this.do_averaging? this.positive_weights_sum: this.positive_weights),
				(this.do_averaging? this.negative_weights_sum: this.negative_weights),
				explain );
		},
}

module.exports = WinnowHash;

