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
 *  <li>multiclass - if true, the 'classify' function returns an array [label,score]. If false (default), it returns only a score.
 */

function scikit(opts) {
	/*
	if (!SvmLinear.isInstalled()) {
		var msg = "Cannot find the executable 'liblinear_train'. Please download it from the LibLinear website, and put a link to it in your path.";
		console.error(msg)
		throw new Error(msg); 
	}
	*/	

	if (opts.classifier == "")
		throw new Error("The scikit classifier is undefined")

	// this.learn_args = opts.learn_args || "";
	this.model_file_prefix = "scikit_" + opts.classifier
	this.classifier = opts.classifier
	// this.bias = opts.bias || 1.0;
	// this.multiclass = opts.multiclass || false;
	// this.debug = opts.debug||false;
  	// this.train_command = opts.train_command //|| 'liblinear_train'
  	// this.test_command = opts.test_command //|| 'liblinear_test'
  	// this.timestamp = ""
}

/*SvmLinear.isInstalled = function() {
    try {
        var result = execSync("liblinear_train");
        return true;
    } catch (err) {
        return false;
    }
};
*/
var util  = require('util')
  , child_process = require('child_process')
  , exec = require('child_process').exec
  , fs   = require('fs')
  , svmcommon = require('./svm/svmcommon')
  , _ = require('underscore')._

var FIRST_FEATURE_NUMBER=1;  // in lib linear, feature numbers start with 1
var trainFile = ""
var log_file = "~/nlu-server/logs/" + process.pid

console.vlog = function(data) {
    //fs.appendFileSync(log_file, data + '\n', 'utf8')
    console.log(data)
    fs.writeFileSync(log_file, data + '\n', 'utf8')
};


scikit.prototype = {
		/**
		 * Send the given dataset to liblinear_train.
		 *
		 * @param dataset an array of samples of the form {input: [value1, value2, ...] , output: 0/1} 
		 */
		trainBatch: function(dataset) {
			this.timestamp = new Date().getTime()+"_"+process.pid

			// check for multilabel
			_.each(dataset, function(datum, key, list){
				if (_.isArray(datum.output))
					if (datum.output.length > 1)
						throw new Error("Multilabeling is not allowed");
            }, this)

            // var dataset = _.filter(dataset, function(num){ return !isZero(num.input) });
        
            dataset = _.compact(dataset)
			console.vlog("DEBUGTRAIN: trainBatch: trainsize after compacting "+dataset.length)

            //  convert all array-like outputs to just values
			dataset = _.map(dataset, function(datum){ 
				if (_.isArray(datum.output))
					datum.output = datum.output[0]
				return datum });            

			//console.log(process.pid+" DEBUGTRAIN: count output "+JSON.stringify(_.countBy(dataset, function(datum) { return datum.output }), null, 4))

			this.allLabels = _(dataset).map(function(datum){return datum.output});
			this.allLabels = _.uniq(_.flatten(this.allLabels))
			console.vlog("DEBUGTRAIN: trainBatch: all possible labels: "+this.allLabels)

			 dataset = _.map(dataset, function(datum){ 
				datum.output = this.allLabels.indexOf(datum.output)
				return datum }, this);
				
			//console.log(util.inspect(dataset,{depth:1}));
			var learnFile = svmcommon.writeDatasetToFile(
					dataset, this.bias, /*binarize=*/false, "/tmp/logs/train_svm_" + this.timestamp, "SvmLinear", FIRST_FEATURE_NUMBER);
			
			// var modelFile = learnFile.replace(/[.]learn/,".model");

			// var command = this.train_command+" "+this.learn_args+" "+learnFile + " "+modelFile;
			// console.vlog("DEBUGTRAIN: trainBatch: running "+command);

			
			this.trainFile = learnFile;
			
			},
		

		/**
		 * @param features - a feature-value hash.
		 * @param explain - int - if positive, an "explanation" field, with the given length, will be added to the result.  
		 * @param continuous_output if true, return the net classification score. If false [default], return 0 or 1.
		 * @return the binary classification - 0 or 1.
		 */
		
		classifyBatch: function(testSet) {

			var timestamp = new Date().getTime()+"_"+process.pid
			var trainset = []
			var explain = 0

			console.vlog("DEBUGCLASSIFY: classifyBatch: test size: "+testSet.length)
			console.vlog("DEBUGCLASSIFY: classifyBatch: : "+this.allLabels)

			_.each(testSet, function(value, key, list){
				trainset.push({ 'input': value, 'output':999 })
			}, this)
			
			var testFile = svmcommon.writeDatasetToFile(
                                        trainset, this.bias, /*binarize=*/false, "/tmp/logs/test_svm_" + timestamp, "SvmLinear", FIRST_FEATURE_NUMBER);

			// var command = this.test_command+" "+testFile + " " + this.modelFileString + " /u/ir/konovav/nlu-server/trainedClassifiers/tempfiles/out_" + timestamp;
			var command = "python "+__dirname+"/scikit.py " + this.trainFile + " " + testFile + " " + this.classifier
			// var command = this.test_command+" "+testFile + " " + this.modelFileString + " /u/ir/konovav/nlu-server/trainedClassifiers/tempfiles/out_" + timestamp;
 	
 			console.vlog(command)		
			var output = child_process.execSync(command)

			var result = JSON.parse(output.toString())

			console.vlog("DEBUGCLASSIFY: classifyBatch: result "+JSON.stringify(result))
			console.vlog("DEBUGCLASSIFY: classifyBatch: result number "+result.length)

			var resultInt = _.map(result, function(num){ return this.allLabels[parseInt(num)] }, this)

			if (result == -1)
				throw new Error("something happened")

			console.vlog("DEBUGCLASSIFY: classifyBatch: result "+JSON.stringify(resultInt))
			console.vlog("DEBUGCLASSIFY: classifyBatch: result number "+resultInt.length)

			if (resultInt.length != testSet.length)
				throw new Error("the length of the output doesn't equal to the lenght of the test set")
			

		 	return (explain>0?
		 	 {
		 	    classes: resultInt,
		 	    classification: resultInt,
		 	    explanation: [],
		 	 }:
		 	    resultInt  )
		},

		
};


/*
 * UTILS
 */

/*var NEWLINE = require('os').EOL;

var LIB_LINEAR_MODEL_PATTERN = new RegExp(
		"[\\S\\s]*"+    // skip the beginning of string
		"^label (.*)"+NEWLINE+  // parse the label-list line
		"^nr_feature .*"+NEWLINE+  // parse the feature-count line (not used)
		"^bias (.*)"+NEWLINE+  // parse the bias line (not used - we use our own bias)
		"^w"+NEWLINE+                // start of weight matrix
		"([\\S\\s]*)" + // parse the weights
		"", "m");

var MIN_WEIGHT = 1e-5; // weights smaller than this are ignored, to save space

/**
 * A utility that converts a model in the SvmLinear format to a matrix of feature weights per label.
 * @param modelString a string.
 * @returns mapLabelToMapFeatureToWeight.
 */

function isZero(vector)
{
	var zero = true
	_.each(vector, function(value, key, list){
		if (value == 1)
			zero = false
	}, this)
	return zero
}

/*function modelStringToModelMap(modelString) {
	var matches = LIB_LINEAR_MODEL_PATTERN.exec(modelString);
	if (!matches) {
		console.log(modelString);
		throw new Error("Model does not match SVM-Linear format "+modelString);
	};
	var labels = matches[1].split(/\s+/);
	var mapLabelToMapFeatureToWeight = {};
	for (var iLabel in labels) {
		var label = labels[iLabel];
		mapLabelToMapFeatureToWeight[label]={};
	}

	var weightsMatrix = matches[3];
	// each line represents a feature; each column represents a label:
	
	var weightsLines = weightsMatrix.split(NEWLINE);
	for (var feature in weightsLines) {
		var weights = weightsLines[feature].split(/\s+/);
		weights.pop(); // ignore lal]st weight, which is empty (-space)
		if (weights.length==0)
			continue; // ignore empty lines
//		if (isNaN(parseFloat(weights[weights.length-1])))
//			weights.pop();
		if (weights.length==1 && labels.length==2)
			weights[1] = -weights[0];
		if (weights.length!=labels.length)
			throw new Error("Model does not match SVM-Linear format: there are "+labels.length+" labels ("+labels+") and "+weights.length+" weights ("+weights+")");
		for (var iLabel in labels) {
			var label = labels[iLabel];
			var weight = parseFloat(weights[iLabel]);
			if (Math.abs(weight)>=MIN_WEIGHT)
				mapLabelToMapFeatureToWeight[label][feature]=weight;
		}
	}

	return mapLabelToMapFeatureToWeight;
}
*/


module.exports = scikit;


