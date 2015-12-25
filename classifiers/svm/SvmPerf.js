/**
 * A wrapper for Thorsten Joachims' SVM-perf package.
 * 
 * To use this wrapper, the SVM-perf executable (svm_perf_learn) should be in your path. 
 * 
 * You can download SVM-perf here: http://www.cs.cornell.edu/people/tj/svm_light/svm_perf.html
 * subject to the copyright license.
 *
 * @author Erel Segal-haLevi
 * @since 2013-09-02
 * 
 * @param opts options: <ul>
 *	<li>learn_args - a string with arguments for svm_perf_learn  (see http://www.cs.cornell.edu/people/tj/svm_light/svm_perf.html )
 *  <li>model_file_prefix - prefix to path to model file (optional; the default is to create a temporary file in the system temp folder).
 *  <li>bias - constant (bias) factor (default: 1).
 */

var fs   = require('fs')
  , util  = require('util')
  , execSync = require('child_process').execSync
  , svmcommon = require('./svmcommon')	
  , _ = require("underscore")._;
  

function SvmPerf(opts) {
	if (!SvmPerf.isInstalled()) {
	 	var msg = "Cannot find the executable 'svm_perf_learn'. Please download it from the SvmPerf website, and put a link to it in your path.";
	 	console.error(msg)
	 	throw new Error(msg); 
	}
	this.learn_args = opts.learn_args || "";
	this.learn_args += " --b 0 ";  // we add the bias here, so we don't need SvmPerf to add it
	this.model_file_prefix = opts.model_file_prefix || null;
	this.bias = 'bias' in opts? opts.bias: 1.0;
	this.debug = opts.debug || false;
	this.ShowFeat = {}
}

SvmPerf.isInstalled = function() {
    try {
        var result = execSync("svm_perf_learn -c 1 a");
        return true;
    } catch (err) {
        return false;
    }
}

var FIRST_FEATURE_NUMBER=1;  // in svm perf, feature numbers start with 1, not 0!

SvmPerf.prototype = {
		trainOnline: function(features, expected) {
			//throw new Error("SVM-perf does not support online training");
			console.error("SVM-perf does not support online training");
		},

		/**
		 * Send the given dataset to svm_perf_learn.
		 *
		 * @param dataset an array of samples of the form {input: [value1, value2, ...] , output: 0/1} 
		 */
		trainBatch: function(dataset) {
			if (this.debug) console.log("trainBatch start");
			
			var timestamp = new Date().getTime()+"_"+process.pid
			var learnFile = svmcommon.writeDatasetToFile(dataset, this.bias, /*binarize=*/true, this.model_file_prefix+"_"+timestamp, "SvmPerf", FIRST_FEATURE_NUMBER);
			var modelFile = learnFile.replace(/[.]learn/,".model");
			var command = "svm_perf_learn "+this.learn_args+" "+learnFile + " "+modelFile;
			if (this.debug) console.log("running "+command);
			console.log(command)
	
			var result = execSync(command);
			if (result.code>0) {
				console.dir(result);
				console.log(fs.readFileSync(learnFile, 'utf-8'));
				throw new Error("Failed to execute: "+command);
			}

			this.setModel(fs.readFileSync(modelFile, "utf-8"));
			if (this.debug) console.log("trainBatch end");
		},
		
		setModel: function(modelString) {
			this.modelString = modelString;
			this.mapFeatureToWeight = modelStringToModelMap(modelString);  // weights in modelMap start from 0 (- the bias).
			if (this.debug) console.dir(this.mapFeatureToWeight);
			// console.log("maps"+JSON.stringify(_.keys(this.mapFeatureToWeight).length, null, 4))
			// process.exit(0)
		},

		getFeatures: function() {
			var featlist = []
			_.each(this.mapFeatureToWeight, function(weight, index, list){
				if (parseInt(index) == 0)
					featlist.push(['bias', weight])
				else
					featlist.push([this.featureLookupTable.numberToFeature(parseInt(index)-1), weight])
			}, this)
			featlist = _.sortBy(featlist, function(num){return num[1]})
			return featlist
		},
		
		getModelWeights: function() {
			return this.mapFeatureToWeight;
		},

		/**
		 * @param features - a feature-value hash.
		 * @param explain - int - if positive, an "explanation" field, with the given length, will be added to the result.  
		 * @param continuous_output if true, return the net classification score. If false [default], return 0 or 1.
		 * @return the binary classification - 0 or 1.
		 */
		classify: function(features, explain, continuous_output) {
			return svmcommon.classifyWithModelMap(
					this.mapFeatureToWeight, this.bias, features, explain, continuous_output, this.featureLookupTable);
		},

		/**
		 * Link to a FeatureLookupTable from a higher level in the hierarchy (typically from an EnhancedClassifier), used ONLY for generating meaningful explanations. 
		 */
		setFeatureLookupTable: function(featureLookupTable) {
			//console.log("SVMPERF setFeatureLookupTable "+featureLookupTable);
			this.featureLookupTable = featureLookupTable;
		},
		
		toJSON: function() {
			return this.mapFeatureToWeight; 
		},
		
		fromJSON: function(json) {
			this.mapFeatureToWeight = json;  
		},
};


/*
 * UTILS
 */

var SVM_PERF_MODEL_PATTERN = new RegExp(
		"[\\S\\s]*"+ 
		"^([\\S\\s]*) # threshold b[\\S\\s]*"+  // parse the threshold line
		"^([\\S\\s]*) #[\\S\\s]*" + // parse the weights line
		"", "m");

var MIN_WEIGHT = 1e-5; // weights smaller than this are ignored, to save space

/**
 * A utility that converts a model in the SVMPerf format to a map of feature weights.
 * @param modelString a string.
 * @returns a map.
 */
function modelStringToModelMap(modelString) {
	var matches = SVM_PERF_MODEL_PATTERN.exec(modelString);
	if (!matches) {
		console.log(modelString);
		throw new Error("Model does not match SVM-perf format");
	};
	//var threshold = parseFloat(matches[1]);  // not needed - we use our own bias
	var featuresAndWeights = matches[2].split(" ");
	var mapFeatureToWeight = {};
	//mapFeatureToWeight.threshold = threshold; // not needed - we use our own bias
	
	//String alphaTimesY = featuresAndWeights[0]; // always 1 in svmperf
	for (var i=1; i<featuresAndWeights.length; ++i) {
		var featureAndWeight = featuresAndWeights[i];
		var featureWeight = featureAndWeight.split(":");
		if (featureWeight.length!=2)
			throw new Error("Model featureAndWeight doesn't match svm-perf pattern: featureAndWeight="+featureAndWeight);
		var feature = parseInt(featureWeight[0]);
		if (feature<=0)
			throw new IllegalArgumentException("Non-positive feature id: featureAndWeight="+featureAndWeight);
		var weight = parseFloat(featureWeight[1]);
		if (Math.abs(weight)>=MIN_WEIGHT)
			mapFeatureToWeight[feature-FIRST_FEATURE_NUMBER]=weight;   // start feature values from 0.
			// Note: if there is bias, then mapFeatureToWeight[0] is its weight.
	}
	return mapFeatureToWeight;
}



module.exports = SvmPerf;

