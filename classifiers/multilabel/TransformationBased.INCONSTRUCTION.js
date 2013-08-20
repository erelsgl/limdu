/**
 * A Multi-Label Transformation-Based Learner (Brill, 1999 and others).
 * Learns rules for adding/removing labels, based on the features.
 *
 * @author Erel Segal-haLevi
 * @since 2013-08-18
 * 
 * @param opts optional parameters: <ul>
 *	<li>debug 
 */
 
var mlutils = require("../../utils");
var hash = mlutils.hash;
//var sprintf = require("sprintf").sprintf;  // for explanations
var _ = require("underscore")._;

function TransformationBasedMultiLearner(opts) {
	if (!opts) opts = {}

	this.debug = opts.debug || false;
	
	this.errorFunction = opts.errorFunction || mlutils.hammingDistance;
		
	this.rules = [];
}


TransformationBasedMultiLearner.prototype = {
		
		toJSON: function(folder) {
			return {
				rules: this.rules,
			}
		},

		fromJSON: function(json) {
			this.rules = json.rules;
		},

		/**
		 * train online (a single instance).
		 *
		 * @param features a SINGLE training sample (a hash of feature-value pairs).
		 * @param labels an ARRAY of zero or more labels.
		 */
		trainOnline: function(features, labels) {
			//return this.train_features(
			//	this.normalized_features(features, /*remove_unknown_features=*/false), expected);
		},

		/**
		 * Batch training (a set of instances). 
		 *
		 * @param dataset an array of samples of the form {input: {feature1: value1...} , output: [label1, label2...]} 
		 */
		trainBatch: function(dataset) {
			this.rules = [];
			var allFeatures = _(dataset).reduce(function(memo, datum){ 
				return _(memo).extend(datum.input); 
			}, {});
			console.log("found "+Object.keys(allFeatures).length+" features");
			
			
		},
		

		/**
		 * @param inputs a SINGLE sample; a hash (feature => value).
		 * @param continuous_output if true, return the net classification score. If false [default], return 0 or 1.
		 * @param explain - int - if positive, an "explanation" field, with the given length, will be added to the result.  
		 * @param positive_weights_for_classification, negative_weights_for_classification -
		  the weights vector to use (either the running 'weights' or 'weights_sum').  
		 * @return the classification of the sample.
		 */
		classify: function(features, continuous_output, positive_weights_for_classification, negative_weights_for_classification, explain) {

			if (explain) var explanations = [];

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
}

module.exports = TransformationBasedMultiLearner;

