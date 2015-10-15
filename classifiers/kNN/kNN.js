var _ = require("underscore")._;
var fs = require("fs");

/**
 * kNN classifier
 */

var kNN = function(opts) {
	this.k = opts.k
	this.mode = opts.mode
	this.distanceFunctionList = opts.distanceFunctionList
	this.distanceWeightening = opts.distanceWeightening
	this.labels = []
}

kNN.prototype = {

	trainOnline: function(sample, labels) {
	},

	trainBatch : function(dataset) {
		this.dataset = dataset
	},

	classify: function(sample, explain) {

		var trainset = _.map(this.dataset, function(value){ return {
																	'input': this.complement(value['input']),
																	'output': value['output']
																	}
																 }, this);

		// is canceled due to "okay is fine"
		// var eq = _.filter(trainset, function(value){ return _.isEqual(value['input'], sample); });
		
		// if (eq.length != 0)
			// return { 
				 	// 'classification': (eq[0]['output'] == 1 ? 1 : -1),
				 	// 'explanation': 'same'
		   			// }
		
		var distances = _.map(trainset, function(value){ return {
																'input'   : value['input'],
																'output'  : value['output'],
																'distance': _.reduce(this.distanceFunctionList, function(memo, df){ return memo + df(sample, value['input']); }, 0),
																'score':    _.reduce(this.distanceFunctionList, function(memo, df){ return memo + df(sample, value['input']); }, 0),

																// 'distance': dfmap[this.distanceFunction](sample, value['input']),
																// 'score'   : this.distanceWeightening(_.reduce(this.distanceFunctionList, function(memo, df){ return memo + df(sample, value['input']); }, 0))
																}
																}, this);

		var distances = _.sortBy(distances, function(num){ return num['distance']; })

		// eliminate Infinite and null

		var distances = _.filter(distances, function(num){ return !isNaN(parseFloat(num['distance'])) && isFinite(num['distance']) });
		
		if (distances.length == 0)
		{
			if (this.mode == 'binary')
				return {'classification': -1, 'explanation': 'not number'}
		}

		var metrics = _.unique(_.sortBy(_.pluck(distances, 'distance')))
		var margin = metrics[this.k]
		var real_k = distances.length - _.find(distances.reverse(), function(num){ return num['distance'] == margin })
		var knn = distances.slice(0, real_k)

		var output = _.groupBy(knn, function(num){ return num['output'] })

		if (this.mode == 'multi')
		{
			return { 
					 'classes': Object.keys(output),
					 'explanation': output
			  		}
		}

		var thelabel = {'label': -1, 'score': -1}

		_.each(output, function(value, label, list){ 
			var sum = _.reduce(value, function(memo, num){ return memo + num['score']; }, 0);
			if (sum > thelabel['score'])
				{
					thelabel['score'] = sum	
					thelabel['label'] = label	
				}
		}, this)

		// _.each(knn, function(val, key, list){ 
			// console.log(val)
			// console.log(this.translaterow(val['input']))
		// }, this)

		if (this.mode == 'binary')
			return { 
					 'classification': (thelabel['label'] == 1 ? thelabel['score'] : (-1) * thelabel['score']),
					 'explanation': this.translatetrain(knn)
			  		}
		},

	translatetrain: function(input)
	{
		if (this.featureLookupTable)
		{
			_.each(input, function(value, key, list){ 
				input[key]['input'] = this.translaterow(value['input'])
			}, this)
			return input
		}
		else
		return input

	},

	translaterow: function(row)
	{
		var output = {}

		_.each(row, function(value, key, list){ 
			if (value != 0)
				output[this.featureLookupTable['featureIndexToFeatureName'][key]] = value
		}, this)

		return output
	},

	complement: function(input) {
		var len = this.featureLookupTable['featureIndexToFeatureName'].length
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