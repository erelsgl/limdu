/**
 * A wrapper for Thorsten Joachims' SVM-perf multi-class package.
 * This classifier was created for Short Text Classification Problem
 *
 */

var fs   = require('fs')
  , util  = require('util')
  , execSync = require('execSync').exec
  , exec = require('child_process').exec
  , svmcommon = require('./svmcommon')	
  , _ = require("underscore")._;
  

function SvmPerf_multi(opts) {
	if (!SvmPerf_multi.isInstalled()) {
		var msg = "Cannot find the executable 'svm_multiclass_learn'. Please download it from the SvmPerf website, and put a link to it in your path.";
		console.error(msg)
		throw new Error(msg); 
	}
	this.learn_args = opts.learn_args || "";
	// this.learn_args += " - ";  // we add the bias here, so we don't need SvmPerf to add it
	this.model_file_prefix = opts.model_file_prefix || null;
	this.bias = false
	this.debug = opts.debug || false;
	this.ShowFeat = {}
	this.labels = []
	this.modelFile = "" // keep the make of model file for classification
}

SvmPerf_multi.isInstalled = function() {
	var result = execSync("svm_multiclass_learn -c 1 a");
	return (result.code!=127);
}

var FIRST_FEATURE_NUMBER=1;  // in svm perf, feature numbers start with 1, not 0!

SvmPerf_multi.prototype = {
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

			var labels = ['nonzero']
			_.each(dataset, function(value, key, list){ 
				
				if (!_.isArray(value['output']))
				{
					console.log(dataset[key]['output'] + " is not an array")
					process.exit(0)	
				}

				if (dataset[key]['output'].length > 1)
				{
					console.log(dataset[key] + " is not approprite for multi-class problem")
					process.exit(0)
				}

				labels.push(value['output'][0])

				dataset[key]['output'] = value['output'][0]
			}, this)

			this.labels = _.unique(labels)

			// change string labels to int labels

			_.each(dataset, function(value, key, list){ 
				dataset[key]['output'] = this.labels.indexOf(dataset[key]['output'])
			}, this)

			if (this.debug) console.log("trainBatch start");

			// binarization was disabled due to multi-class problem

			var learnFile = svmcommon.writeDatasetToFile(dataset, this.bias, /*binarize=*/false, this.model_file_prefix, "SvmPerf", FIRST_FEATURE_NUMBER);

			var modelFile = learnFile.replace(/[.]learn/,".model");

			this.modelFile = modelFile

			console.log(this.modelFile)			

			var command = "svm_multiclass_learn "+this.learn_args+" "+learnFile + " "+modelFile;
			
			console.log(command)

			if (this.debug) console.log("running "+command);
			
			console.log("Run SVM")
			var result = execSync(command);
			if (result.code>0) {
				console.dir(result);
				console.log(fs.readFileSync(learnFile, 'utf-8'));
				throw new Error("Failed to execute: "+command);
			}
			console.log("SVM is finished")
			
			if (this.debug) console.log("trainBatch end");
		},
		
		classifyBatch: function(dataset, explain, continuous_output) {

			dataset = _.map(dataset, function(value){ return {'input': value['input'], 'output': this.labels.indexOf(value['output'])} }, this);
			
			var classifyFile = svmcommon.writeDatasetToFile(dataset, this.bias, /*binarize=*/false, "class", "SvmPerf", FIRST_FEATURE_NUMBER);

			var outputFile = classifyFile.replace(/[.]learn/,".output");

			var command = "svm_multiclass_classify -v 3 "+ classifyFile + " " + this.modelFile + " " + outputFile; 
			if (this.debug) console.log("running "+command);
			
			console.log("Run SVM")
			var result = execSync(command);
			
			console.log(result['stdout'].split("\n"))

			console.log("SVM is finished")

			console.log(outputFile)

			if (this.debug) console.log("trainBatch end");

			var output = fs.readFileSync(outputFile, 'utf-8')
			output = output.split("\n")

			var dataset_new = []

			_.each(output, function(value, key, list){ 
				var row = value.split(' ')
				dataset_new.push(this.labels[row[0]])
			}, this)

			dataset_new = _.compact(dataset_new)

			return dataset_new

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



module.exports = SvmPerf_multi;

