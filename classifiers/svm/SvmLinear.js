/**
 * A wrapper for the LibLinear package, by Fan, Chang, Hsieh, Wang and Lin.
 * 
 * To use this wrapper, the LibLinear executable (liblinear_train) should be in your path. 
 * 
 * You can download LibLinear here: http://www.csie.ntu.edu.tw/~cjlin/liblinear/
 * subject to the copyright license.
 *
 * @author Erel Segal-haLevi
 * @since 2013-09-09
 * 
 * @param opts options: <ul>
 *	<li>learn_args - a string with arguments for liblinear_train
 *  <li>model_file_prefix - prefix to path to model file (optional; the default is to create a temporary file in the system temp folder).
 *  <li>bias - constant (bias) factor (default: 1).
 */

function SvmLinear(opts) {
	this.learn_args = opts.learn_args || "";
	this.model_file_prefix = opts.model_file_prefix || null;
	this.bias = opts.bias || 1.0;
	this.debug = opts.debug||false;
}

var util  = require('util')
  , execSync = require('execSync').exec
  , exec = require('child_process').exec
  , fs   = require('fs')
  , svmcommon = require('./svmcommon')
  ;



SvmLinear.prototype = {
		trainOnline: function(features, expected) {
			throw new Error("LibLinear does not support online training");
		},

		/**
		 * Send the given dataset to liblinear_train.
		 *
		 * @param dataset an array of samples of the form {input: [value1, value2, ...] , output: 0/1} 
		 */
		trainBatch: function(dataset) {
			if (this.debug) console.log("trainBatch start");
			var learnFile = svmcommon.writeDatasetToFile(dataset, this.bias, /*binarize=*/false, this.model_file_prefix, "SvmLinear");
			var modelFile = learnFile.replace(/[.]learn/,".model");
			
			var command = "liblinear_train "+this.learn_args+" "+learnFile + " "+modelFile;
			if (this.debug) console.log("running "+command);
	
			var result = execSync(command);
			if (result.code>0) {
				console.dir(result);
				console.log(fs.readFileSync(learnFile, 'utf-8'));
				throw new Error("Failed to execute: "+command);
			}
			
			var modelString = fs.readFileSync(modelFile, "utf-8");
			this.modelMap = modelStringToModelMap(modelString, this.bias);
			
			if (this.debug) console.dir(this.modelMap);
			if (this.debug) console.log("trainBatch end");
		},
	
		

		/**
		 * @param features - a feature-value hash.
		 * @param explain - int - if positive, an "explanation" field, with the given length, will be added to the result.  
		 * @param continuous_output if true, return the net classification score. If false [default], return 0 or 1.
		 * @return the binary classification - 0 or 1.
		 */
		classify: function(features, explain, continuous_output) {
			return svmcommon.classifyWithModelMap(this.modelMap, this.bias, features, explain, continuous_output);
		},
};


/*
 * UTILS
 */


var LIB_LINEAR_MODEL_PATTERN = new RegExp(
		"[\\S\\s]*"+    // skip the beginning of string
		"^bias ([\\S\\s]*)"+  // parse the bias line
		"^w$"+                // start of weight vector
		"([\\S\\s]*)" + // parse the weights
		"", "m");

/**
 * A utility that converts a model in the SvmLinear format to a map of feature weights.
 * @param modelString a string.
 * @returns mapFeatureToWeight.
 */
function modelStringToModelMap(modelString, bias) {
	var matches = LIB_LINEAR_MODEL_PATTERN.exec(modelString);
	if (!matches) {
		console.log(modelString);
		throw new Error("Model does not match SVM-Linear format");
	};
	//var threshold = parseFloat(matches[1]);  // not needed - we use our own bias
	var featuresAndWeights = matches[2].split(/\s+/);
	var mapFeatureToWeight = {};
	//mapFeatureToWeight.threshold = threshold; // not needed - we use our own bias
	
	//String alphaTimesY = featuresAndWeights[0]; // always 1 in SvmLinear
	
	while (isNaN(parseFloat(featuresAndWeights[0])))
		featuresAndWeights.shift();
	for (var feature=0; feature<featuresAndWeights.length; ++feature) {
		var weight = parseFloat(featuresAndWeights[feature]);
		if (isNaN(weight))
			continue;
		mapFeatureToWeight[feature] = -weight;   // the weight represent class 0, so we have to take the negative
	}
	return mapFeatureToWeight;
}



module.exports = SvmLinear;

