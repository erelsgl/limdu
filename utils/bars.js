/*
	This module was created as a utils for limdu, many of the routines were copied from train.js of nlu-server

	@author Vasily Konovalov
 */

var _ = require('underscore')._;
var fs = require('fs');
// var Hierarchy = require('../Hierarchy');
var multilabelutils = require('../classifiers/multilabel/multilabelutils');

// @stats - dataset in the format after test_hash, i.e. the hash with parameters 'data', 'stats', 'labels'
// output is the data labels where there is an error
module.exports.filtererror = function(stats)
{
	stats_filtered=[]
	 _.each(stats['data'], function(value, key, list){ 
		if ((value['explanation']['FP'].length != 0) || (value['explanation']['FN'].length != 0))
		{
		stats_filtered.push(value)	
		}
	});
	return stats_filtered
}

// @data is a dataset in the original format (array of JSON with input output parameters)
// output - list of the labels and the occurrences of the labels in the dataset.
module.exports.bars = function(data)
{ 
	labelhash = {}
	_.each(data, function(value, key, list){
		output = _.flatten((splitPartEqually(multilabelutils.normalizeOutputLabels(value.output))))		
		_.each(output, function(lab, key, list){
			if (!(lab in labelhash))
				labelhash[lab] = 1
			else
				 labelhash[lab] = labelhash[lab] + 1
			}, this)

		}, this)

		lablist = []
		for (lab in labelhash)
			{
				lablist.push([lab,labelhash[lab]])
			}
		lablist = _.sortBy(lablist, function(num){ return num[1]; });
	return lablist

}

// @data is a dataset in the original format (array of JSON with input output parameters)
// output - tree with the hierarchy of the labels.
module.exports.labeltree = function(data)
	{
	Observable = {}
		_.each(data, function(datum, key, list){				
			_.each(multilabelutils.normalizeOutputLabels(datum.output), function(lab, key, list){				
				_.each(splitJson(lab), function(element, key, list){
					if (key==0)
						if (!(element in Observable))
								Observable[element] = {}
					if (key==1)
						if (!(element in Observable[list[key-1]]))
								Observable[list[key-1]][element] = {}
					if (key==2)
						if (!(element in Observable[list[key-2]][list[key-1]]))
								Observable[list[key-2]][list[key-1]][element] = {}

				}, this)
			}, this)
		}, this)
	return Observable
	}

// @output - is the label in the separate format (intent, attribute, value), observable - tree of the labels
// output - list of the ambiguities for intents and labels.
module.exports.intent_attr_label_ambiguity = function(output, Observable)
	{
	ambiguity = []
	// console.log(output)
	_.each(output[1], function(attr, key, list){
			listt = []
			_.each(output[0], function(intent, key, list){
				if (Object.keys(Observable[intent]).indexOf(attr) != -1)
					{
					listt.push(intent)
					} 
				}, this)
			// console.log(listt)
			if (listt.length >= 2)
				{
					amb = {}
					amb['attr'] = attr
					amb['list'] = listt
					ambiguity.push(amb)
				}
			}, this)
	// console.log(ambiguity)
	// console.log("___________________")
	return ambiguity
	}

// the same as previous but for the dataset
module.exports.intent_attr_dataste_ambiguity = function(data, Observable)
	{
	ambiguity = []
	_.each(data, function(value, key, list){ 
			output = (Hierarchy.splitPartEqually(multilabelutils.normalizeOutputLabels(value.output)))	
			_.each(output[1], function(attr, key, list){
				listt = []
				_.each(output[0], function(intent, key, list){
					if (Object.keys(Observable[intent]).indexOf(attr) != -1)
						{
						listt.push(intent)
						} 
					}, this)

				if (listt.length >= 2)
					{
						amb = {}
						amb['attr'] = attr
						amb['list'] = listt
						ambiguity.push(amb)
					}
				}, this)
		}, this)
	return ambiguity
}

// testSet - dataset
// output - clone of the dataset
module.exports.clonedataset = function(testSet)
{
	testSet1 = []
	_.each(testSet, function(value, key, list){
		testSet1.push(_.clone(value))
		})
	return testSet1
}

function splitJson(json) {
	return splitJsonRecursive(_.isString(json) && /{.*}/.test(json)?
		JSON.parse(json):
		json);
}
 
function splitJsonRecursive(json) {
	if (!_.isObject(json))
		return [json];
	var firstKey = Object.keys(json)[0];
	var rest = splitJsonRecursive(json[firstKey]);
	rest.unshift(firstKey);
	return rest;
}

function splitPartEqually(json) {	
	label = []	

	_(3).times(function(n){
		buf = []
		_.each(json.map(splitJson), function(value, key, list){
			if (_.compact(value[n]).length != 0)
				buf = buf.concat(value[n])
		})

		buf = _.uniq(buf)

		if ((buf.length > 0) && (typeof(buf[0])!="undefined"))
			label[n] = buf
		if ((typeof(buf[0])=="undefined"))
			label[n] = []
	})
	return label
}