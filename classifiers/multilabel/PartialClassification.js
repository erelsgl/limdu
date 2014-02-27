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
		classifier = new this.multilabelClassifierType();
		dataset = this.transformdataset(dataset)
		classifier.trainBatch(dataset)
		this.classifier.push(classifier)
	},

	classify: function(sample, explain) {
		value = []
	 _.each(this.classifier, function(classif, key, list){
	 	value = value.concat(classif.classify(sample)) 	
	 	})
	 return value
 	},


	convertstring: function(sample)	{

		var normalizedLabels = multilabelutils.normalizeOutputLabels(sample);

		label = []
		_(3).times(function(n){ 
				label = label.concat(_.uniq(_.map(normalizedLabels.map(this.splitLabel), function(num){ return num[n];})))
			}
		, this)

		label = _.filter(label, function(num){ if ( typeof num !== 'undefined' ) {return [num];} })

		return _.map(_.uniq(label), function(num){ return [num];})
	
	},

	transformdataset: function(dataset) {
		dataset = dataset.map(function(datum) {
		return {
				input: datum.input,
				output: this.convertstring(datum.output)
		}
		}, this)
		return dataset	
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

