var sprintf = require("sprintf").sprintf;
var _ = require("underscore")._;
var partitions = require('../../utils/partitions');
var multilabelutils = require('./multilabelutils');

/**
 *  PartialClassification is a test classifier that learns and classifies the components \
 * of the labels separately, for example, a labels consist of 3 part: intent, attribute, value
 * so there are a classifier for intent, attribute and value.
 *
 */

var PartialClassification = function(opts) {
	
	opts = opts || {};
	if (!opts.multilabelClassifierType) {
		console.dir(opts);
		throw new Error("opts.multilabelClassifierType is null");
	}
	this.multilabelClassifierType = opts.multilabelClassifierType;
	this.splitLabel = opts.splitLabel || function(label)      {return label.split(/@/);}
	this.classifier = []
}


PartialClassification.prototype = {

	trainOnline: function(sample, labels) {

	},

	trainBatch : function(dataset) {
		dataset = dataset.map(function(datum) {
			var normalizedLabels = multilabelutils.normalizeOutputLabels(datum.output);
			return {
				input: datum.input,
				output: this.splitLabel(normalizedLabels)
			}
		}, this);

		// console.log(JSON.stringify(dataset, null, 4));
		
		_(3).times(function(n){

			data = dataset.map(function(datum) {
				return {
					input: datum.input,
					output: datum.output[n]
				}
			}, this);

			// console.log(JSON.stringify(data, null, 4));

			classifier = new this.multilabelClassifierType();
			classifier.trainBatch(data)
			this.classifier.push(classifier)

			}, this)
		
	},

	toFormat: function(dataset) {
		dataset = dataset.map(function(datum) {
			var normalizedLabels = multilabelutils.normalizeOutputLabels(datum.output);
			return {
				input: datum.input,
				output: _.flatten(this.splitLabel(normalizedLabels))
			}
		}, this);
		return dataset
	},

	classify: function(sample, explain) {
		value = []
	 _.each(this.classifier, function(classif, key, list){
	 	value = value.concat(classif.classify(sample)) 	
	 	})
	 return value
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

