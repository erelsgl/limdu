var hash = require("../../utils/hash");
var sprintf = require("sprintf").sprintf;
var _ = require("underscore")._;
var fs = require('fs');
var partitions = require('../../utils/partitions');
var execSync = require('execSync')
var temp = require('temp')
var execSync = require('execSync')

/**
 * Adaptive Boosting (Adaboost) is a greedy search for a linear combination of 
 * classifiers by overweighting the examples that are misclassified by each 
 * classifier. icsiboost implements Adaboost over stumps (one-level decision trees) 
 * on discrete and continuous attributes (words and real values). 
 * See http://en.wikipedia.org/wiki/AdaBoost and the papers by Y. Freund and R. Schapire for more details.
 * 
 * @param opts
 *            ngram_length (optional) 
 *            iterations (optional) 
 *  
 * The class uses icsiboost open-source implementation of Boostexter
 * https://code.google.com/p/icsiboost/
 */

var kNN = function(opts) {

	this.k = opts.k
	this.distanceFunction = opts.distanceFunction
	this.distanceWeightening = opts.distanceWeightening

	this.labels = []
	
	this.distancemap = { '1/d':'-I',
							'1-d':'-F',
							'No' :''}
}

kNN.prototype = {

	trainOnline: function(sample, labels) {
	},

	trainBatch : function(dataset) {
		this.dataset = dataset
	},

	classify: function(sample, explain) {

		this.learnFile = temp.openSync({prefix:"kNN-", suffix:".learn.arff"});
		this.testFile = temp.openSync({prefix:"kNN-", suffix:".test.arff"});

		if (!(this.distanceWeightening in this.distancemap))
		{
			console.error("distanceWeightening not in distancemap")
			process.exit(0)
		}

		// console.log(this.learnFile.path)
		// console.log(this.testFile.path)

		this.writeData(this.dataset, 0, this.learnFile)

		var dataset = [{'input': sample, 'output': '?'}]
		this.writeData(dataset, 0, this.testFile)

		var command = "java weka.classifiers.lazy.IBk "+
		"-t " + this.learnFile.path + " -T " + this.testFile.path + " " + this.distancemap[this.distanceWeightening] + " -K 1 -W 0 "+
		"-A \"weka.core.neighboursearch.LinearNNSearch -A \\\"weka.core." + this.distanceFunction + " -R first-last\\\"\" -p 0"

		// console.log(command)
		result = execSync.exec(command)

		// console.log(JSON.stringify(result, null, 4))

		var res = this.processResult(result)

		var score = (res['label'] == 1 ? res['labelscore'] : (-1)*res['labelscore']);

		return {'classification': score}
	},

	processResult: function(result) {
		var output = result['stdout'].split("\n\n")[2].split("\n")[1].split(" ")
		var output = _.compact(output)
		_.each(output, function(value, key, list){ 
			output[key] = output[key].split(":")
		}, this)

		return {'label': output[2][1],
				'labelscore': output[3][0]}
	},
	/*0-train 1 set*/
	writeData: function(dataset, mode, filename) {

		var output = "@RELATION kNN\n\n"
			
		_.each(this.featureLookupTable['featureIndexToFeatureName'], function(value, key, list){ 
			output += "@ATTRIBUTE\t'" + value + "'\t" + "REAL\n"
		}, this)

		output += "@ATTRIBUTE\tclass\t{0,1}\n"
		output += "\n@DATA\n"


		_.each(dataset, function(value, key, list){ 
			value['input'] = this.complement(value['input'], this.featureLookupTable['featureIndexToFeatureName'].length)
			// if (value['output'] != '?')
				output +=  value['input'].join(",") + "," + value['output'] + "\n"
			// else
				// output += "?," + value['input'].join(",") + "\n"
		}, this)
	
		fs.writeSync(filename.fd, output);
		fs.closeSync(filename.fd);
	},

	complement: function(input, len) {
		_(len - input.length).times(function(n){
			input.push(0)
		})
		return input
	},

	getAllClasses: function() {
	},

	stringifyClass: function (aClass) {
		return (_(aClass).isString()? aClass: JSON.stringify(aClass));
	},

	toJSON : function() {
	},

	fromJSON : function(json) {
	},
	
	setFeatureLookupTable: function(featureLookupTable) {
		this.featureLookupTable = featureLookupTable
	},
}


module.exports = kNN;


/*{
    "featureIndexToFeatureName": [
        null,
        "the",
        "most",
        "i",
        "will",
        "do",
        "is",
        "the most",
        "most i",
        "i will",
        "will do",
        "do is",
        "would",
        "like",
        "a",
        "i would",
        "would like",
        "like a"
    ],
    "featureNameToFeatureIndex": {
        "undefined": 0,
        "the": 1,
        "most": 2,
        "i": 3,
        "will": 4,
        "do": 5,
        "is": 6,
        "the most": 7,
        "most i": 8,
        "i will": 9,
        "will do": 10,
        "do is": 11,
        "would": 12,
        "like": 13,
        "a": 14,
        "i would": 15,
        "would like": 16,
        "like a": 17
    }
}
*/