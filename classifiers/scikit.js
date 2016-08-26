function scikit(opts) {

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
    console.log(data)
    fs.writeFileSync(log_file, data + '\n', 'utf8')
};

scikit.prototype = {
		
		trainBatch: function(dataset) {
		
			console.vlog("trainBatch")	
			console.vlog(JSON.stringify(dataset, null, 4))			

			this.timestamp = new Date().getTime()+"_"+process.pid

/*			_.each(dataset, function(datum, key, list){
				if (!_.isArray(datum.output))
					dataset[key]["output"] = [datum.output]
			}, this)
*/
			

			_.each(dataset, function(datum, key, list){
				if (_.isArray(datum.output))
					dataset[key]["output"] = datum.output[0]
			}, this)

			// var dataset = _.filter(dataset, function(num){ return num.output.length>0 });

			this.nr_feature = dataset[0]["input"].length
        
            dataset = _.compact(dataset)

			console.vlog("DEBUGTRAIN: trainBatch: trainsize after compacting "+dataset.length)
	
              //          dataset = _.filter(dataset, function(num){ return num.output != "" });

 
			this.allLabels = _(dataset).map(function(datum){return datum.output});
			this.allLabels = _.uniq(_.flatten(this.allLabels))
			console.vlog("DEBUGTRAIN: trainBatch: all possible labels: "+this.allLabels)

			/*dataset = _.map(dataset, function(datum){ 
				datum.output = convertfromLabels(datum.output, this.allLabels)
			return datum }, this);
			*/	
			
			 dataset = _.map(dataset, function(datum){ 
				datum.output = this.allLabels.indexOf(datum.output)
				return datum }, this);


			//console.log(util.inspect(dataset,{depth:1}));
			var learnFile = svmcommon.writeDatasetToFile(
					dataset, this.bias, /*binarize=*/false, "/tmp/logs/train_svm_" + this.timestamp, "SvmLinear", FIRST_FEATURE_NUMBER);
			
			this.trainFile = learnFile;
			
			},
		

		/**
		 * @param features - a feature-value hash.
		 * @param explain - int - if positive, an "explanation" field, with the given length, will be added to the result.  
		 * @param continuous_output if true, return the net classification score. If false [default], return 0 or 1.
		 * @return the binary classification - 0 or 1.
		 */
		
		classifyBatch: function(testSet) {


          if (this.allLabels.length == 1)
                               {
                               allLabels = this.allLabels
                               return Array.apply(null, Array(testSet.length)).map(function (x, i) { return [allLabels[0]] })                          
                              }

			var timestamp = new Date().getTime()+"_"+process.pid
			var trainset = []
			var explain = 0

			console.vlog("DEBUGCLASSIFY: classifyBatch: test size: "+testSet.length)
			console.vlog("DEBUGCLASSIFY: classifyBatch: : "+this.allLabels)

			_.each(testSet, function(value, key, list){
				trainset.push({ 'input': value, 'output':999 })
				if (value.length > this.nr_feature)
					this.nr_feature = value.length
			}, this)
			
			var testFile = svmcommon.writeDatasetToFile(
                                        trainset, this.bias, /*binarize=*/false, "/tmp/logs/test_svm_" + timestamp, "SvmLinear", FIRST_FEATURE_NUMBER);

			// var command = this.test_command+" "+testFile + " " + this.modelFileString + " /u/ir/konovav/nlu-server/trainedClassifiers/tempfiles/out_" + timestamp;
			var command = "python "+__dirname+"/scikit.py " + this.trainFile + " " + testFile + " " + this.classifier + " " + this.nr_feature
			// var command = this.test_command+" "+testFile + " " + this.modelFileString + " /u/ir/konovav/nlu-server/trainedClassifiers/tempfiles/out_" + timestamp;
 	
 			console.vlog(command)		
			var output = child_process.execSync(command)

			var result = JSON.parse(output.toString())

			console.vlog("DEBUGCLASSIFY: classifyBatch: result "+JSON.stringify(result))
			console.vlog("DEBUGCLASSIFY: classifyBatch: result number "+result.length)

			// var resultInt = _.map(result, function(num){ return converttoLabels(num, this.allLabels) }, this)
			var resultInt = _.map(result, function(num){ return this.allLabels[parseInt(num)] }, this)


			console.vlog("DEBUGCLASSIFY: classifyBatch: result "+JSON.stringify(resultInt))
			console.vlog("DEBUGCLASSIFY: classifyBatch: result number "+resultInt.length)

			if (resultInt.length != testSet.length)
				throw new Error("the length of the output doesn't equal to the lenght of the test set")
			
		 	return resultInt
		},

		
};

function converttoLabels(output, listofLabels)
{
	if (!_.isArray(output))
		throw new Error("converttoLabels: output is not array")

	return _.map(output, function(datum){ return listofLabels[parseInt(datum)] });            	
}

function convertfromLabels(output, listofLabels)
{
	if (!_.isArray(output))
		throw new Error("convertfromLabels: output is not array")

	return _.map(output, function(datum){ return listofLabels.indexOf(datum) });            	
}

function isZero(vector)
{
	var zero = true
	_.each(vector, function(value, key, list){
		if (value == 1)
			zero = false
	}, this)
	return zero
}

module.exports = scikit;


