var hash = require("../../utils/hash");
var sprintf = require("sprintf").sprintf;
var _ = require("underscore")._;
var fs = require('fs');
var partitions = require('../../utils/partitions');
var execSync = require('execSync')
var crypto = require('crypto')
var execSync = require('execSync').exec
var multilabelutils = require('./multilabelutils');


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

var PartialClassification = function(opts) {
	// if (!Adaboost.isInstalled()) {
	// 	var msg = "Cannot find the executable 'icsiboost'.";
	// 	console.error(msg)
	// 	throw new Error(msg); 
	// }

	// this.set_of_labels = []
	// this.text_expert = 'ngram'
	// this.assigner = crypto.randomBytes(20).toString('hex');
	// this.folder = "icsiboost_data"

	// this.ngram_length = opts.ngram_length || 2
	// this.iterations = opts.iterations || 2000

	opts = opts || {};
	if (!opts.multilabelClassifierType) {
		console.dir(opts);
		throw new Error("opts.multilabelClassifierType is null");
	}

	this.multilabelClassifierType = opts.multilabelClassifierType;
	this.splitLabel = opts.splitLabel || function(label)      {return label.split(/@/);}
	this.joinLabel  = opts.joinLabel  || function(superlabel) {return superlabel.join("@");}
	
	// this.classifier1 =  new this.multilabelClassifierType();
	// this.classifier2 =  new this.multilabelClassifierType();
	// this.classifier3 =  new this.multilabelClassifierType();

	this.classifier = []

	this.allClasses = {}
}


PartialClassification.prototype = {

	trainOnline: function(sample, labels) {
	
	},

	trainBatch : function(dataset) {
		
		console.log(dataset[2].output)

		

		classifier = new this.multilabelClassifierType();

		dataset = dataset.map(function(datum) {
			var normalizedLabels = multilabelutils.normalizeOutputLabels(datum.output);
			
			
		label = []
		_(3).times(function(n){ 
						
				label = label.concat(_.uniq(_.map(normalizedLabels.map(this.splitLabel), function(num){ return [num[n]];})))
			}

			
		, this);

		return {
				input: datum.input,
				output: _.uniq(label, false, _.difference(a, b).length == 0)
				}

		}, this);

		// console.log(JSON.stringify(dataset))
		// process.exit(0)
		console.log(dataset[2].input)
		console.log(dataset[2].output)
		process.exit(0)
		classifier.trainBatch(dataset)
		this.classifier.push(classifier)
 		


	// console.log("done")
	// process.exit(0)
		// console.log(dataset.output)
		// process.exit(0)
	},

	classify: function(sample, explain) {

	},

	transformtest: function(sample) {
		
		var normalizedLabels = multilabelutils.normalizeOutputLabels(sample);
		
		if (normalizedLabels.length == 0)
			{
			return normalizedLabels;
			}
		
		label = []
		_(3).times(function(n){
			// for (var i in normalizedLabels)
			{
			
			label = label.concat(_.uniq(_.map(normalizedLabels.map(this.splitLabel), function(num){ return [num[n]];})))
			}
		}, this)

		return _.uniq(label);
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
	
	},
}


module.exports = PartialClassification;

