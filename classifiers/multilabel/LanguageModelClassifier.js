var hash = require("../../utils/hash");
var FeaturesUnit = require("../../features");
var sprintf = require("sprintf").sprintf;
var _ = require("underscore")._;

/**
 * A classifier based on language modelling.
 *
 * Inspired by:
 *
 * Leuski Anton, Traum David. A Statistical Approach for Text Processing in Virtual Humans tech. rep.University of Southern California, Institute for Creative Technologies 2008.
 * http://www.citeulike.org/user/erelsegal-halevi/article/12540655
 *
 * @author Erel Segal-haLevi
 * 
 * @param opts
 *            smoothingFactor (optional) - lambda for Jelinek-Mercer smoothing. 
 */
var LanguageModelClassifier = function(opts) {
	this.smoothingFactor = opts.smoothingFactor || 0.9;
}

LanguageModelClassifier.prototype = {

	/**
	 * Tell the classifier that the given sample belongs to the given classes.
	 * 
	 * @param sample
	 *            a document.
	 * @param classes
	 *            an object whose KEYS are classes, or an array whose VALUES are classes.
	 */
	trainOnline: function(sample, classes) {
		throw new Error("LanguageModelClassifier does not support online training");
	},

	/**
	 * Train the classifier with all the given documents.
	 * 
	 * @param dataset
	 *            an array with objects of the format: 
	 *            {input: sample1, output: [class11, class12...]}
	 */
	trainBatch : function(dataset) {
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
		
	},
	
	/**
	 * Calculate the Kullback-Leibler divergence between the language models of the given samples.
	 * This can be used as an approximation of the (inverse) semantic similarity. between them. 
	 *
	 * @param hashes of features.
	 * @note divergence is not symmetric - divergence(a,b) != divergence(b,a).
	 */
	divergence: function(sample1, sample2) {         // (6)   D(P(W)||P(F)) = ...
		var sum = 0;
		for (var f2 in sample2) {
			var prob_f2_cond_sample1 = prob2cond1(f2, sample1);   // P(f|W)
			var prob_f2_cond_sample2 = prob2cond2(f2, sample2);   // phi_F(f)
			sum += prob_f2_cond_sample1 * Math.log(prob_f2_cond_sample1 / prob_f2_cond_sample2);
		}
		return sum;
	},

	prob2cond1: function(f2, sample1) {  // (5)   P(f|W) = ...
		
	},
}


/**
 * @return log(exp(a)+exp(b)) 
 * @note handles large numbers robustly.        
 */
function logSumExp(a, b) {
	if (a>b) {
		if (b-a>-10)
			return a + Math.log(1+Math.exp(b-a));
		else
			return a;
	} else {
		if (a-b>-10)
			return b + Math.log(1+Math.exp(a-b));
		else
			return b;
	}
}


/**
 * @param a vector of numbers.
 * @return log(sum[i=1..n](exp(ai))) = 
 *         m + log(sum[i=1..n](exp(ai-m)))
 * Where m = max[i=1..n](ai)
 * @note handles large numbers robustly.        
 */
function logSumExp(a) {
	var m = max(a);
	var sum = 0;
	for (var i=0; i<a.length; ++i)
		if (a[i]>m-10)
			sum += Math.exp(a[i]-m);
	return m + Math.log(sum);
}

module.exports = LanguageModelClassifier;
