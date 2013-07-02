var hash = require("../hash");

/**
 * A simple Perceptron implementation.
 *
 * Based on code by John Chesley:  https://github.com/chesles/perceptron
 *
 * the weights vector is a hash (not a numeric array), so the features can be any objects (not just nubmers).
 *
 * @author Erel Segal-haLevi
 * @since 2013-05-27
 * 
 * @param opts optional parameters: <ul>
 *	<li>debug 
 *  <li>default_weight: default weight for a newly discovered feature (default = 0).
 *  <li>do_averaging: boolean, see http://ciml.info/dl/v0_8/ciml-v0_8-ch03.pdf . But count only weight vectors with successful predictions (Carvalho and Cohen, 2006).
 *  <li>do_normalization: boolean, normalize sum of features to 1.
 *	<li>learning_rate: defaults to 0.1.
 *  <li>retrain_count: in batch training mode, how many times to retrain. 0=no retrain. Default=1.
 * 
 */
 
var PerceptronHash = function(opts) {
	if (!opts) opts = {};
	
	this.debug = opts.debug||false;
	this.default_weight = opts.default_weight||0;
	this.do_averaging = opts.do_averaging||false;
	this.do_normalization = opts.do_normalization||false;
	this.learning_rate = opts.learning_rate||0.1;
	this.retrain_count = opts.retrain_count||1;
	
	this.weights = {};
	if (this.do_averaging) this.weights_sum = {};   // for averaging; see http://ciml.info/dl/v0_8/ciml-v0_8-ch03.pdf . But count only weight vectors with successful predictions (Carvalho and Cohen, 2006).
}


PerceptronHash.prototype = {

	toJSON: function() {
		return {
			weights: this.weights,
			weights_sum: this.weights_sum
		}
	},

	fromJSON: function(json) {
		this.weights = json.weights;
		this.weights_sum = json.weights_sum;
	},

	normalized_features: function (features, remove_unknown_features) {
		features['bias'] = 1;
		if (remove_unknown_features) {
			for (var feature in features)
				if (!(feature in this.weights))
					delete features[feature];
		} 
		if (this.do_normalization) 
			hash.normalize_sum_of_values_to_1(features);
		return features;
	},

	/**
	 * @param features a SINGLE training sample; a hash (feature => value).
	 * @param expected the classification value for that sample (0 or 1)
	 * @return true if the input sample got its correct classification (i.e. no change made).
	 */
	train_features: function(features, expected) {
		for (feature in features) 
			if (!(feature in this.weights)) 
				this.weights[feature] = this.default_weight;

		var result = this.perceive_features(features, /*net=*/false, this.weights); // always use the running 'weights' vector for training, and NOT the weights_sum!

		if (this.debug) console.log('> training ',features,', expecting: ',expected, ' got: ', result);

		if (result != expected) {
			// Current model is incorrect - adjustment needed!
			if (this.debug) console.log('> adjusting weights...', this.weights, features);
			for (var feature in features) 
				this.adjust(result, expected, features[feature], feature);
			if (this.debug) console.log(' -> weights:', this.weights)
		} else {
			if (this.do_averaging) hash.add(this.weights_sum, this.weights);
		}
		
		return (result == expected);
	},

	/**
	 * Online training (a single sample).
	 *
	 * @param features a SINGLE training sample; a hash (feature => value).
	 * @param expected the classification value for that sample (0 or 1)
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


	adjust: function(result, expected, input, feature) {
		var delta = (expected - result) * this.learning_rate * input;
		if (isNaN(delta)) throw new Error('delta is NaN!! result='+result+" expected="+expected+" input="+input+" feature="+feature);
		this.weights[feature] += delta;
		if (isNaN(this.weights[feature])) throw new Error('weights['+feature+'] went to NaN!! delta='+d);
	},
		

	/**
	 * @param features a SINGLE sample; a hash (feature => value).
	 * @param weights_for_classification the weights vector to use (either the running 'weights' or 'weights_sum').  
	 * @param net if true, return the net classification value. If false [default], return 0 or 1.
	 * @return the classification of the sample.
	 */
	perceive_features: function(features, net, weights_for_classification) {
		var result = hash.inner_product(features, weights_for_classification);
		if (this.debug) console.log("> perceive_features ",features," = ",result);
		return net
			? result
			: result > 0 ? 1 : 0
	},

	/**
	 * @param inputs a SINGLE sample.
	 * @param net if true, return the net classification value. If false [default], return 0 or 1.
	 * @return the classification of the sample.
	 */
	perceive: function(inputs, net) {
		return this.perceive_features(
			this.normalized_features(inputs, /*remove_unknown_features=*/true), 
			net,
			(this.do_averaging? this.weights_sum: this.weights) );
	},

	/**
	 * @param inputs a SINGLE sample.
	 * @return the binary classification - 0 or 1.
	 */
	classify: function(inputs) {
		return this.perceive(inputs, false);
	},
}


module.exports = PerceptronHash;
