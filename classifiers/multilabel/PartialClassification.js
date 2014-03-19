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
	
	classifier = []
	_(3).times(function(n){ 
		 classif = new opts.multilabelClassifierType();
		classifier.push(classif);
 	});
	this.classifier = classifier
	// this.Observable = {}
}

PartialClassification.prototype = {

	trainOnline: function(sample, labels) {
		throw new Error("PartialClassification does not support online training");
	},

	// setObservable: function(Observable) {
	// 	this.Observable = Observable
	// },

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


	// joinLabel: function(values)
	// {
 // 	values = _.flatten(values)
	// possib = []
	// 	for (intent in this.Observable)
	// 	{
	// 	for (attr in this.Observable[intent])
	// 		{
	// 		if (Object.keys(this.Observable[intent][attr]).length==0)
	// 			if ((values.indexOf(intent)!=-1) && (values.indexOf(attr)!=-1))
	// 				possib.push(this.joinJson([intent,attr]))
	// 		for (value in this.Observable[intent][attr])
	// 			{
	// 			if ((values.indexOf(intent)!=-1) && (values.indexOf(attr)!=-1) && (values.indexOf(value)!=-1))
	// 				{
	// 				possib.push(this.joinJson([intent,attr,value]))
	// 				}
	// 			}
	// 		}
	// 	}
	// return possib
	// },
	classify: function(sample, explain, continuous_output) {
		// console.log(continuous_output)
		// string = "[start] "+ continuous_output.toLowerCase().replace(/[\.,\,]/g,"").replace(/\%/g," %")+" [end]"
		// console.log("asdsd")
		// console.log(string)
		// console.log("----------")
		
		explanation = []

		explain = 0
		values = []

		// return this.classifier[0].classify(sample, explain)
		
	 	_.each(this.classifier, function(classif, key, list){
	 		value = classif.classify(sample, explain) 
	 	 	if (value.length!=0) values.push(_.flatten(value))

		 		
	 		// for (label in value['explanation']['positive'])
	 		// 	{
	 		// 		console.log("label"+label)
	 		// 		console.log("featu"+value['explanation']['positive'][label][0]['feature'])
	 		// 		values.push([label, string.indexOf(value['explanation']['positive'][label][0]['feature'])])
	 		// 	}

	 		// explanation = explanation.concat(value[0]['explanation']['positive'])

	 		// console.log(JSON.stringify(value, null, 6))
	 		// process.exit(0)

	 			// console.log(JSON.stringify(stats['stats'], null, 4))
	 		// console.log("asd")

	 		// console.log(JSON.stringify(value['explanation']['positive'], null, 6))
	 		// 	process.exit(0)	
	 	})

	 	// console.log(this.joinLabel(values))
	 	// process.exit(0)

	 		return values

	 	// return this.joinLabel(values)

	 	// values = _.flatten(values)
	 	// console.log(values)
	 	// process.exit(0)
	 	// console.log(values)
	 	
	 	// possib = []
	 	// _.each(values, function(intent, key, list){
	 	// 	_.each(values, function(attr, key, list){
	 	// 		_.each(values, function(value, key, list){
	 	// 			if (intent in this.Observable)
	 	// 				if (attr in this.Observable[intent])
	 	// 					if (value in this.Observable[intent][attr])
	 	// 						possib.push(intent+attr+value)

	 	// 		})
	 	// 	})
	 	// })
		// console.log(this.Observable)
		// process.exit(0)
		// for (intent in this.Observable)
		// 	{
		// 	// console.log(intent)
		// 	for (attr in this.Observable[intent])
		// 		{
		// 		// console.log(attr)
		// 		if (Object.keys(this.Observable[intent][attr]).length==0)
		// 			if ((values.indexOf(intent)!=-1) && (values.indexOf(attr)!=-1))
		// 				possib.push(this.joinJson([intent,attr]))
		// 		for (value in this.Observable[intent][attr])
		// 			{
		// 			// console.log(intent+attr+value)
		// 			if ((values.indexOf(intent)!=-1) && (values.indexOf(attr)!=-1) && (values.indexOf(value)!=-1))
		// 				{
		// 				possib.push(this.joinJson([intent,attr,value]))
		// 				}
		// 			}
		// 		}
		// 	}


	 	// console.log(possib)
	 	// console.log("----------------------------")

	 	
	 	// process.exit(0)
	 	// console.log(explanation)
	 	// process.exit(0)
	 	// return possib
 	},

// 	joinJson: function(parts) {
// 	var json = this.joinJsonRecursive(parts);
// 	return _.isString(json)? json: JSON.stringify(json);
// },

	// joinJsonRecursive: function(parts) {
	// var firstKey = parts[0];
	// if (parts.length<=1)
	// 	return (firstKey=='true'? true: firstKey);
	// else {
	// 	var result = {};
	// 	result[firstKey] = this.joinJsonRecursive(parts.slice(1));
	// 	return result;
	// }},
 	setFeatureLookupTable: function(featureLookupTable) {
 		_.each(this.classifier, function(classif, key, list){
	 		classif.setFeatureLookupTable(featureLookupTable)
	 	})
 	},
	
	getAllClasses: function() {
		throw new Error("No implementation in PartialClassification");
	},

	// stringifyClass: function (aClass) {
	// 	return (_(aClass).isString()? aClass: JSON.stringify(aClass));
	// },

	toJSON : function() {
		throw new Error("No implementation in PartialClassification");
	},

	fromJSON : function(json) {
		throw new Error("No implementation in PartialClassification");
	},
	
	// setFeatureLookupTable: function(featureLookupTable) {
	// 	throw new Error("No implementation in PartialClassification");
	// },
}

module.exports = PartialClassification;

//console.log("BR setFeatureLookupTable "+featureLookupTable);
	// 	this.featureLookupTable = featureLookupTable;
	// 	for (var label in this.mapClassnameToClassifier)
	// 		if (featureLookupTable && this.mapClassnameToClassifier[label].setFeatureLookupTable)
	// 			this.mapClassnameToClassifier[label].setFeatureLookupTable(featureLookupTable);
	// },


