/*
	Correlation between unseen words and False Negative 

	The assumption is that previously unseen word mostly might cause false negative type of mistake.
	Module does cross-validation on the given dataset, in the test utterances where there is 
	unseen words and false negative mistake the the dict is build, where the key is a word and 
	the value is the list of false negative mistakes.

	@author Vasily Konovalov
 */

var _ = require('underscore')._;
var fs = require('fs');
var partitions = require('./partitions');
var trainAndTest = require('./trainAndTest').trainAndTest;
var trainAndTest_hash= require('./trainAndTest').trainAndTest_hash;

function normalizer(sentence) {
	if (typeof sentence == 'undefined')
		{return ""}
	else
		{
		return sentence.toLowerCase().trim();
		}
}

function tokenizedataset(dataset, tokenize)
{ 
	vocabulary = []
	for (var sample in dataset) 
    {
		if (dataset[sample].length!=0)
	   	{
	   	var words = tokenize(normalizer(dataset[sample]['input']));
    	vocabulary = vocabulary.concat(words);
    	}
	 }
    return _.uniq(vocabulary);
}

module.exports.tokenize = function(str)
	{
		pattern = new RegExp(/(\w+|\!|\'|\"")/i);
		str = str.split(pattern)
		return _.without(str,'',' ')
	}
/*
	@params dataset - dataset to estimate the correlation
	@params classifier - classifier to estimate false negative mistakes.

	*/
module.exports.unseen_correlation = function(dataset, classifier, tokenize) {
	unseen_correlation = {}

	partitions.partitions(dataset, 5, function(trainSet, testSet, index) { 
		unseen_vocabulary = tokenizedataset(testSet, tokenize)
		seen_vocabulary = tokenizedataset(trainSet, tokenize)
		var stats  = trainAndTest_hash(classifier, trainSet, testSet, 5);
	
	_.each(stats['data'],  function(report, key, list){ 
		if (report['explanations']['FN'].length > 0)
			{
			unseen_words = _.difference(tokenize(normalizer(report['input'])), seen_vocabulary)
			_.each(unseen_words, function(word, key, list) {
	    		if (!(word in unseen_correlation))
	    			{
    				unseen_correlation[word] = []
	    			}
	    		unseen_correlation[word].push(report['explanations']['FN'])
	    		})
			}
		})
  	})
  	return unseen_correlation
}
