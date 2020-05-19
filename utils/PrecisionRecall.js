var hash = require("./hash");
var sprintf = require("sprintf-js").sprintf;
var _ = require("underscore")._;

/**
 * PrecisionRecall - an object for tracking results of experiments: precision, recall, f1, and execution time.
 * 
 * @author Erel Segal-haLevi
 * @since 2013-06
 *
 * The present version is from https://github.com/erelsgl/limdu/blob/d61166c91a81daee62e3d67d5fff2b06cee8191f/utils/PrecisionRecall.js
 * @author Vasily Konovalov
 * @since 2015-10-15
 */
 
 
 https://github.com/erelsgl/limdu/blob/d61166c91a81daee62e3d67d5fff2b06cee8191f/utils/PrecisionRecall.js
 
var PrecisionRecall = function() {
	this.count = 0; // total count
	this.TP = 0;   // True Positive count
	this.TN = 0;   // True Negative count
	this.FP = 0;   // False Positive count
	this.FN = 0;   // False Negative count
	this.TRUE = 0; // Total true count (TP+TN)
	this.startTime = new Date(); 
	this.labels = {}
	this.dep = {}
	this.confusion = {}  // confusion matrix
}

PrecisionRecall.prototype = {
		
	/**
	 * Record the result of a new binary experiment.
	 * 
	 * @param expected - the expected result (true/false).
	 * @param actual   - the actual   result (true/false).
	 */
	addCase: function(expected, actual) {
		this.count++;
		if (expected && actual) this.TP++;
		if (!expected && actual) this.FP++;
		if (expected && !actual) this.FN++;
		if (!expected && !actual) this.TN++;
		if (expected==actual) this.TRUE++;
	},

	/**
	 * Record the result of a new classes experiment per labels.
	 *
	 * @param expectedClasses - the expected set of classes (as an array or a hash).
	 * @param actualClasses   - the actual   set of classes (as an array or a hash).
	 * @return an array of explanations "FALSE POSITIVE", "FALSE NEGATIVE", and maybe also "TRUE POSITIVE"
	 */
	addCasesLabels: function (expectedClasses, actualClasses ) {
		var explanations = [];

		actualClasses = hash.normalized(actualClasses);    // converts e.g. ['a', 'b', 'c'..] to a hash {'a': true, 'b': true, 'c': true};
		expectedClasses = hash.normalized(expectedClasses);

		actualClassesList = Object.keys(actualClasses)
		expectedClassesList = Object.keys(expectedClasses)

		if (!(expectedClassesList[0] in this.confusion)) 
			this.confusion[expectedClassesList[0]] = {}

		if (!(Object.keys(actualClasses)[0] in this.confusion[expectedClassesList[0]])) 
			this.confusion[expectedClassesList[0]][Object.keys(actualClasses)[0]] = 0

		this.confusion[expectedClassesList[0]][Object.keys(actualClasses)[0]] += 1 

		for (var actualClass in actualClasses) {
			if (!(actualClass in this.confusion)) 
				this.confusion[actualClass]={}

			if (!(actualClass in this.labels)) {
				this.labels[actualClass]={}
				this.labels[actualClass]['TP']=0
				this.labels[actualClass]['FP']=0
				this.labels[actualClass]['FN']=0
			}

			if (actualClass in expectedClasses) { 
				this.labels[actualClass]['TP'] += 1 

			} else {
				this.labels[actualClass]['FP'] += 1
			}
		}
		for (var expectedClass in expectedClasses) {

			if (!(expectedClass in this.labels)) {
				this.labels[expectedClass]={}
				this.labels[expectedClass]['TP']=0
				this.labels[expectedClass]['FP']=0
				this.labels[expectedClass]['FN']=0
				}

			if (!(expectedClass in actualClasses)) {
				this.labels[expectedClass]['FN'] += 1 
			}
		}
	},

	/* intented to calculate macro and micro average */
	addPredicition: function(expectedClasses, actualClasses) {
		this.addCasesHash(expectedClasses, actualClasses, 1)
		this.addCasesLabels(expectedClasses, actualClasses)
	},

	/**
	 * Record the result of a new classes experiment.
	 *
	 * @param expectedClasses - the expected set of classes (as an array or a hash).
	 * @param actualClasses   - the actual   set of classes (as an array or a hash).
	 * @param logTruePositives- if true, log the true positives. 
	 * @return an array of explanations "FALSE POSITIVE", "FALSE NEGATIVE", and maybe also "TRUE POSITIVE"
	 */
	addCases: function (expectedClasses, actualClasses, logTruePositives) {
		var explanations = [];
		actualClasses = hash.normalized(actualClasses);
		expectedClasses = hash.normalized(expectedClasses);

		var allTrue = true;
		for (var actualClass in actualClasses) {
			if (actualClass in expectedClasses) { 
				if (logTruePositives) explanations.push("\t\t+++ TRUE POSITIVE: "+actualClass);
				this.TP++;
			} else {
				explanations.push("\t\t--- FALSE POSITIVE: "+actualClass);
				this.FP++;
				allTrue = false;
			}
		}
		for (var expectedClass in expectedClasses) {
			if (!(expectedClass in actualClasses)) {
				explanations.push("\t\t--- FALSE NEGATIVE: "+expectedClass);
				this.FN++;
				allTrue = false;
			}
		}
		if (allTrue) {
			if (logTruePositives) explanations.push("\t\t*** ALL TRUE!");
			this.TRUE++;
		}
		this.count++;
		return explanations;
	},

	/**
	 * Record the result of a new classes experiment in a hash manner.
	 * Does not do external output -- all stats are put in hash.
	 * @param expectedClasses - the expected set of classes (as an array or a hash).
	 * @param actualClasses   - the actual   set of classes (as an array or a hash).
	 * @param logTruePositives- if true, log the true positives. 
	 * @return an array of explanations "FALSE POSITIVE", "FALSE NEGATIVE", and maybe also "TRUE POSITIVE"
     * @author Vasily Konovalov
	 */
	addCasesHash: function (expectedClasses, actualClasses, logTruePositives ) {
		var explanations = {};
		explanations['TP'] = []; explanations['FP'] = []; explanations['FN'] = [];

		actualClasses = hash.normalized(actualClasses);
		expectedClasses = hash.normalized(expectedClasses);

		var allTrue = true;
		for (var actualClass in actualClasses) {
			if (actualClass in expectedClasses) { 
				if (logTruePositives) explanations['TP'].push(actualClass);
				this.TP++;
			} else {
				explanations['FP'].push(actualClass);
				this.FP++;
				allTrue = false;
			}
		}
		for (var expectedClass in expectedClasses) {
			if (!(expectedClass in actualClasses)) {
				explanations['FN'].push(expectedClass);
				this.FN++;
				allTrue = false;
			}
		}
		if (allTrue) {
			this.TRUE++;
		}
		this.count++;

		_.each(explanations, function(value, key, list){ 
			explanations[key].sort()
		}, this)

		if (explanations['FP'].length == 0)
			delete explanations['FP']

		if (explanations['FN'].length == 0)
			delete explanations['FN']

		return explanations;
	},

	// example of usage see in test
	addCasesHashSeq: function (expectedClasses, actualClasses, logTruePositives ) {

		var ex = []
		var ac = []
		var matchlist = []

		// clean up expected list
		_.each(expectedClasses, function(expected, key, list){ 
			if ((expected.length == 2) || (expected.length == 3))
				ex.push(expected)
		}, this)

		// ac = actualClasses
		// // filtering actual classes		
		// _.each(actualClasses, function(actual, key, list){ 
		// 	var found = _.filter(ac, function(num){ return ((num[0] == actual[0]) && (this.intersection(num[1], actual[1]) == true)) }, this);
		// 	if (found.length == 0)
		// 		ac.push(actual)
		// }, this)

		// console.log(JSON.stringify(actualClasses, null, 4))

		// var ac = this.uniquecandidate(this.uniqueaggregate(actualClasses))
		var ac = actualClasses


		// filling interdependencies between labels 
		// for every candidate (actual) it looks for intersection between actual labels with different 
		// intents, intersection means that different intents came to the common substring, then arrange 
		// all the data in the hash, and mention only keyphrases.

		_.each(ac, function(actual, key, list){
		if (actual.length > 3)
			{	 
			label = actual[0]
			// keyphrase
			str = actual[2]
			if (!(label in this.dep))
				{
				this.dep[label] = {}
				this.dep[label][label] = []
				}
			this.dep[label][label].push(str)

			// intersection, different intents but actual intersection
			var found = _.filter(ac, function(num){ return ((num[0] != actual[0]) && (this.intersection(num[1], actual[1]) == true)) }, this);
			_.each(found, function(sublabel, key, list){
				if (!(sublabel[0] in this.dep[label]))
					this.dep[label][sublabel[0]] = []
				this.dep[label][sublabel[0]].push([[actual[2],actual[4]], [sublabel[2],sublabel[4]]])
			}, this)
			}
		}, this)

		var explanations = {};
		explanations['TP'] = []; explanations['FP'] = []; explanations['FN'] = [];
		
		var explanations_detail = {};
		explanations_detail['TP'] = []; explanations_detail['FP'] = []; explanations_detail['FN'] = [];
		
		var allTrue = true;
		for (var actualClassindex in ac) {
			
			if (!(ac[actualClassindex][0] in this.labels)) {
				this.labels[ac[actualClassindex][0]]={}
				this.labels[ac[actualClassindex][0]]['TP']=0
				this.labels[ac[actualClassindex][0]]['FP']=0
				this.labels[ac[actualClassindex][0]]['FN']=0
				}

			var found = false
			_.each(ex, function(exc, key, list){
				if (ac[actualClassindex][0] == exc[0])
					{
					if ((exc[1].length == 0) || (ac[actualClassindex][1][0] == -1))
						{
						found = true
						matchlist.push(ac[actualClassindex])
						}
					else
						{
						if (this.intersection(ac[actualClassindex][1], exc[1]))
							{
							found = true
							matchlist.push(ac[actualClassindex])
							}
						}
					}
			}, this)

			if (found) { 
				if (logTruePositives)
					{
						explanations['TP'].push(ac[actualClassindex][0]);
						explanations_detail['TP'].push(ac[actualClassindex]);
						this.labels[ac[actualClassindex][0]]['TP'] += 1
						this.TP++
					}
			} else {
				explanations['FP'].push(ac[actualClassindex][0]);
				explanations_detail['FP'].push(ac[actualClassindex]);
				this.labels[ac[actualClassindex][0]]['FP'] += 1
				this.FP++
				allTrue = false;
			}
		}

		for (var expectedClassindex in ex) {
			var found = false

			if (!(ex[expectedClassindex][0] in this.labels)) {
				this.labels[ex[expectedClassindex][0]]={}
				this.labels[ex[expectedClassindex][0]]['TP']=0
				this.labels[ex[expectedClassindex][0]]['FP']=0
				this.labels[ex[expectedClassindex][0]]['FN']=0
				}

			_.each(ac, function(acc, key, list){ 
				if (ex[expectedClassindex][0] == acc[0])
					{
						if ((ex[expectedClassindex][1].length == 0) || (acc[1][0] == -1))
							found = true
						else
							{
							if (this.intersection(ex[expectedClassindex][1], acc[1]))
								found = true
							}
					}
			}, this)

			if (!found)
				{
				explanations['FN'].push(ex[expectedClassindex][0]);
				explanations_detail['FN'].push(ex[expectedClassindex]);
				this.labels[ex[expectedClassindex][0]]['FN'] += 1
				this.FN++;
				allTrue = false;
				}
		}

		if (allTrue) {
			// if ((logTruePositives)&& (!only_false_cases)) explanations.push("\t\t*** ALL TRUE!");
			this.TRUE++;
		}
		this.count++;

		// _.each(explanations, function(value, key, list){ 
			// explanations[key] = _.sortBy(explanations[key], function(num){ num });
			// explanations[key].sort()
		// }, this)

		// console.log(explanations)
		// console.log(matchlist)
		
		// if (expectedClasses.length > 1)
			// process.exit(0)

		return {
				'explanations': explanations,
				'match': matchlist,
				'explanations_detail': explanations_detail
				}
	},

	// simple intersection
	intersection:function(begin, end)
	{
		if ((begin[0]<=end[0])&&(begin[1]>=end[0]))
			return true
		if ((begin[0]>=end[0])&&(begin[0]<=end[1]))
			return true
		return false
	},
	
	retrieveLabels: function()
	{
		_.each(Object.keys(this.labels), function(label, key, list){ 
			
			this.labels[label]['Recall'] = this.labels[label]['TP'] / (this.labels[label]['TP'] + this.labels[label]['FN']);
			this.labels[label]['Precision'] = this.labels[label]['TP'] / (this.labels[label]['TP'] + this.labels[label]['FP']);
			this.labels[label]['F1'] = 2 / (1/this.labels[label]['Recall'] + 1/this.labels[label]['Precision'])

			if (!this.labels[label]['F1']) this.labels[label]['F1'] = -1
		}, this)

		var arlabels = _.pairs(this.labels) 
		arlabels = _.sortBy(arlabels, function(num){ return arlabels[0] })
		this.labels = _.object(arlabels)

		return this.labels
	},

	retrieveStats: function()
	{
		stats = {}
		
		this.calculateStatsNoReturn()

		stats['TP'] = this.TP
		stats['FP'] = this.FP
		stats['FN'] = this.FN

		stats['Accuracy'] = this.Accuracy
		stats['HammingLoss'] = this.HammingLoss
		stats['HammingGain'] = this.HammingGain
		stats['Precision'] = this.Precision
		stats['Recall'] = this.Recall
		stats['F1'] = this.F1

		stats['macroPrecision'] = this.macroPrecision
		stats['macroRecall'] = this.macroRecall
		stats['macroF1'] = this.macroF1
		
		stats['shortStatsString'] = this.shortStatsString
		stats['interdep'] = this.dep
		stats['labels'] = this.labels
		stats['confusion'] = this.confusion

		this.retrieveLabels()

		_.each(this.labels, function(st, lab, list){ 
			_.each(st, function(val, par, list){ 
				stats[lab+"_"+par] = val
			}, this)
		}, this)

		return stats
	},

	calculateStatsNoReturn: function() {
		

		this.macroPrecision = 0
		this.macroRecall = 0
		this.macroF1 = 0

		var macroPrecision = []
		var macroRecall = []
		var macroF1 = []

		

		if (Object.keys(this.labels).length > 3)
		{

			var list_lab = _.toArray(this.labels)
			var macro_stats = {}
			
			_.each(['Precision', 'Recall', 'F1'], function(param, key, list){ 
				macro_stats[param] = _.pluck(list_lab, param)
				// macro_stats[param] = _.filter(macro_stats[param], function(elem){ return (!_.isNaN(elem) && elem >=0)  })
				macro_stats[param] = _.reduce(macro_stats[param], function(memo, num){ if (!_.isNaN(num) && num >=0) {return memo + num} else {return memo} }) / macro_stats[param].length
			}, this)

			this.macroPrecision = macro_stats['Precision']
			this.macroRecall = macro_stats['Recall']
			this.macroF1 = macro_stats['F1']
		}

		this.Accuracy = (this.TRUE) / (this.count);
		this.HammingLoss = (this.FN+this.FP) / (this.FN+this.TP); // "the percentage of the wrong labels to the total number of labels"
		this.HammingGain = 1-this.HammingLoss;
		this.Precision = this.TP / (this.TP+this.FP);
		this.Recall = this.TP / (this.TP+this.FN);
		this.F1 = 2 / (1/this.Recall + 1/this.Precision);
		this.endTime = new Date();
		this.timeMillis = this.endTime-this.startTime;
		this.timePerSampleMillis = this.timeMillis / this.count;
		this.shortStatsString = sprintf("Accuracy=%d/%d=%1.0f%% HammingGain=1-%d/%d=%1.0f%% Precision=%1.0f%% Recall=%1.0f%% F1=%1.0f%% timePerSample=%1.0f[ms]",
				this.TRUE, this.count, this.Accuracy*100, (this.FN+this.FP), (this.FN+this.TP), this.HammingGain*100, this.Precision*100, this.Recall*100, this.F1*100, this.timePerSampleMillis);
		},

	/**
	 * After the experiment is done, call this method to calculate the performance statistics.
	 */
	calculateStats: function() {
		this.calculateStatsNoReturn()
		return this;
	},
	
	calculateMacroAverageStats: function(numOfFolds) {
		hash.multiply_scalar(this, 1.0/numOfFolds);
		this.shortStatsString = sprintf("Accuracy=%1.0f%% HammingGain=%1.0f%% Precision=%1.0f%% Recall=%1.0f%% F1=%1.0f%% timePerSample=%1.0f[ms]",
				this.Accuracy*100, this.HammingGain*100, this.Precision*100, this.Recall*100, this.F1*100, this.timePerSampleMillis);
	},
	
	
	/**
	 * @return the full set of statistics for the most recent experiment.
	 */
	fullStats: function() { 
		return this; 
	},
	
	/**
	 * @return a one-line summary of the main results of the most recent experiment.
	 */
	shortStats: function() {
		return this.shortStatsString;
	}
}

module.exports = PrecisionRecall;
