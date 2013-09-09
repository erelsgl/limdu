/**
 * A wrapper for karpathy's SVM.js package: https://github.com/karpathy/svmjs
 *
 *  This is a binary SVM and is trained using the SMO algorithm.
 *  
 *  Reference: "The Simplified SMO Algorithm" (http://math.unt.edu/~hsp0009/smo.pdf)
 *
 * @author Erel Segal-haLevi
 * @since 2013-09-09
 */

var SvmJsBase = require("svm").SVM;

function SvmJs(opts) {
	this.base = new SvmJsBase();
	this.opts = opts;  // options for SvmJsBase.train
}


SvmJs.prototype = {
	trainOnline :function(features, label) {
		throw new Error("svm.js does not support online training");
	},

	trainBatch: function(dataset) {
		var data = [];
		var labels = [];
		dataset.forEach(function(datum) {
			data.push(datum.input);
			labels.push(datum.output>0? 1: -1);
		});
		return this.base.train(data, labels, this.opts);
	},

	/**
	 * @param features - a feature-value hash.
	 * @param explain - int - if positive, an "explanation" field, with the given length, will be added to the result.  
	 * @param continuous_output if true, return the net classification score. If false [default], return 0 or 1.
	 * @return the binary classification - 0 or 1.
	 */
    classify: function(features, explain, continuous_output) {
    	var score = this.base.marginOne(features);
    	var classification = continuous_output? score: (score>0? 1: 0);
    	
    	if (explain>0) {
            var f = this.base.b;

            // if the linear kernel was used and w was computed and stored,
            // (i.e. the svm has fully finished training)
            // the internal class variable usew_ will be set to true.
            var explanations = [];
            if(this.base.usew_) {
              var w = this.base.w;
              for(var j=0;j<this.base.D;j++) {
            	explanations[j] = {
            		feature: j,
            		value: features[j],
            		weight: w[j],
            		relevance: features[j] * w[j],
            	};
              }
            } else {
            	// explanations not supported.
                //for(var i=0;i<this.N;i++) {
                // f += this.alpha[i] * this.labels[i] * this.kernel(inst, this.data[i]);
                //}
            }
            explanations.sort(function(a,b){return b.relevance-a.relevance});
            return {
            	classification: classification,
            	explanation: explanations.slice(0, explain),
            }
    	} else {
    		return classification;
    	}
    },
    
    toJSON: function() {
    	return this.base.toJSON();
    },
    
    fromJSON: function(json) {
    	this.base.fromJSON(json);
    },
};


module.exports = SvmJs;
