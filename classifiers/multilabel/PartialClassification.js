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

	if (!opts.numberofclassifiers) {
		console.dir(opts);
		throw new Error("opts.numberofclassifiers is null");
	}

	// this.splitLabel = opts.splitLabel || function(label)      {return label.split(/@/);}
	this.classifier = this.intializeClassifiers(opts.numberofclassifiers, opts.multilabelClassifierType)
}

PartialClassification.prototype = {

	intializeClassifiers: function(numberofclassifiers, multilabelClassifierType) {
		classifier = []
	_(numberofclassifiers).times(function(n){ 
		classif = new multilabelClassifierType;
		classifier.push(classif);
 	});
 	return classifier
	},

	trainOnline: function(sample, labels) {
		throw new Error("PartialClassification does not support online training");
	},

	trainBatch : function(dataset) {
		num_of_classifiers = 0

		_.each(dataset, function(value, key, list){
			num_of_classifiers =  Math.max(num_of_classifiers, (value['output']).length)
		}, this);

			
		_(num_of_classifiers).times(function(n){
			data = []
			_.each(dataset, function(value, key, list){
				if (value.output.length - 1 >= n)
					{
						value1 = _.clone(value)
						value1['output'] = value.output[n]
						data.push(value1)
					}

			 },this)

			// classifier = new this.multilabelClassifierType();
			this.classifier[n].trainBatch(data)
			// classifier.trainBatch(data)
			// this.classifier.push(classifier)
			}, this)
	
	},

	classify: function(sample, explain, continuous_output) {
				
		var labels = []
		var explanation = []
		var scores = {}
		
	 	_.each(this.classifier, function(classif, key, list){
	 		var value = classif.classify(sample, explain, continuous_output)
	 	 	if (explain>0)
	 	 		labels.push(value.classes)
	 	 	else
 				labels.push(value)
	 	 	explanation.push(value.explanation)
	 	 	scores = _.extend(scores, value.scores)
	 	})

		if (explain>0)
			{
				var positive = {}
				var negative = {}

				_.each(_.pluck(explanation, 'positive'), function(value, key, list){ 
					positive = _.extend(positive, value)
					}, this)

				_.each(_.pluck(explanation, 'negative'), function(value, key, list){ 
					negative = _.extend(negative, value)
					}, this)
			

			if (_.keys(negative)!=0)
				explanation = {
					positive: positive, 
					negative: negative,
				}
			}

		return (explain>0?
			{
				classes: labels, 
				scores: scores,
				explanation: explanation
			}:
			labels);

		
		// console.log(JSON.stringify(explanation, null, 4))
		// return (explain>0?
		// 	{
		// 		classes: labels, 
		// 		scores: scores,
		// 		explanation: explanation
		// 	}:
		// 	labels);

 	},


 	setFeatureLookupTable: function(featureLookupTable) {
 		_.each(this.classifier, function(classif, key, list){
	 		classif.setFeatureLookupTable(featureLookupTable)
	 	})
 	},
	
	getAllClasses: function() {
		throw new Error("No implementation in PartialClassification");
	},

	toJSON : function() {
		throw new Error("No implementation in PartialClassification");
	},

	fromJSON : function(json) {
		throw new Error("No implementation in PartialClassification");
	},
	
}

module.exports = PartialClassification;

