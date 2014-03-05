var sprintf = require("sprintf").sprintf;
var _ = require("underscore")._;
var multilabelutils = require('./multilabelutils');

/**
 *  PartialClassification is a test classifier that learns and classifies the components
 * of the labels separately according to the splitLabel routine. One of the examples could be 
 * classifying intent, attribute, value separately by three different classifiers.
 * When performing test by trainAndTest module, there is a check for toFormat routine, if it exists
 * then pretest format converting occurs.
 *
 * @author Vasily Konovalov
 * @since March 2014
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
		throw new Error("PartialClassification does not support online training");
	},

	trainBatch : function(dataset) {

		num_of_classifiers = 0
		dataset = dataset.map(function(datum) {
			var normalizedLabels = multilabelutils.normalizeOutputLabels(datum.output);
			num_of_classifiers =  Math.max(num_of_classifiers, (this.splitLabel(normalizedLabels)).length)
			return {
				input: datum.input,
				output: this.splitLabel(normalizedLabels)
			}
		}, this);

		_(num_of_classifiers).times(function(n){

			data = dataset.map(function(datum) {

				return {
					input: datum.input,
					output: datum.output[n]
				}
			}, this);

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
	 		value = value.concat(classif.classify(sample, explain)) 	
	 	})
	 	return value
 	},
	
	getAllClasses: function() {
		throw new Error("No implementation in PartialClassification");
	},

	stringifyClass: function (aClass) {
		return (_(aClass).isString()? aClass: JSON.stringify(aClass));
	},

	toJSON : function() {
		throw new Error("No implementation in PartialClassification");
	},

	fromJSON : function(json) {
		throw new Error("No implementation in PartialClassification");
	},
	
	setFeatureLookupTable: function(featureLookupTable) {
		throw new Error("No implementation in PartialClassification");
	},
}

module.exports = PartialClassification;

