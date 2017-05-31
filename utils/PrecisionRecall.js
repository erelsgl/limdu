var hash = require("./hash");
var sprintf = require('sprintf').sprintf;
var _ = require('underscore')._;

/**
 * PrecisionRecall - an object for tracking results of experiments: precision, recall, f1, and execution time.
 * 
 * @author Erel Segal-haLevi
 * @since 2013-06
 */
var PrecisionRecall = function() {
	this.labels = {}
	this.confusion = {} // only in single label case
	
	this.count = 0;
	this.TRUE = 0;
	this.startTime = new Date();
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
	 * Doesn't allowed to do a inner output, all stats are put in hash
	 * @param expectedClasses - the expected set of classes (as an array or a hash).
	 * @param actualClasses   - the actual   set of classes (as an array or a hash).
	 * @param logTruePositives- if true, log the true positives. 
	 * @return an array of explanations "FALSE POSITIVE", "FALSE NEGATIVE", and maybe also "TRUE POSITIVE"
     * @author Vasily Konovalov
	 */

	addCasesHash: function (expectedClasses, actualClasses, logTruePositives ) {
		var explanations = {};
		explanations['TP'] = []; explanations['FP'] = []; explanations['FN'] = [];

		if (expectedClasses.length == 1)
		{
			var expected = expectedClasses[0]
			if (!(expected in this.confusion))
					this.confusion[expected] = {}
			_.each(actualClasses, function(actualClass, key, list){
				if (!(actualClass in this.confusion[expected]))
					this.confusion[expected][actualClass] = 0
				this.confusion[expected][actualClass] +=1
			}, this)
		}

		actualClasses = hash.normalized(actualClasses);
		expectedClasses = hash.normalized(expectedClasses);

		var allTrue = true;
		for (var actualClass in actualClasses) {

			if (!(actualClass in this.labels)) {
				this.labels[actualClass]={}
				this.labels[actualClass]['TP']=0
				this.labels[actualClass]['FP']=0
				this.labels[actualClass]['FN']=0
				}

			if (actualClass in expectedClasses) { 
				if (logTruePositives) explanations['TP'].push(actualClass);
				this.labels[actualClass]['TP'] += 1 
				// this.TP++;
			} else {
				explanations['FP'].push(actualClass);
				this.labels[actualClass]['FP'] += 1
				// this.FP++;
				allTrue = false;
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
				explanations['FN'].push(expectedClass);
				this.labels[expectedClass]['FN'] += 1 
				// this.FN++;
				allTrue = false;
			}
		}
		if (allTrue) {
			// if ((logTruePositives)&& (!only_false_cases)) explanations.push("\t\t*** ALL TRUE!");
			this.TRUE++;
		}
		this.count++;

		_.each(explanations, function(value, key, list){ 
			// explanations[key] = _.sortBy(explanations[key], function(num){ num });
			explanations[key].sort()
		}, this)

		if (explanations['FP'].length == 0)
			delete explanations['FP']

		if (explanations['FN'].length == 0)
			delete explanations['FN']

		return explanations;
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

	
	/**
	 * After the experiment is done, call this method to calculate the performance statistics.
	 */
	calculateStats: function()
	{
		var stats = {}
		var temp_stats = {}
		
		this.retrieveLabels()

		var labelsstats = _.values(this.labels)

		_.each(['Precision', 'Recall', 'F1'], function(param, key, list){ 
			temp_stats[param] = _.pluck(labelsstats, param)
			// temp_stats[param] = _.filter(temp_stats[param], function(elem){ return (!_.isNaN(elem) && !_.isNull(elem) && elem>-1)  })
			temp_stats[param] = _.reduce(temp_stats[param], function(memo, num){ if (!_.isNaN(num) && !_.isNull(num) && num>-1) {return (memo + num)} else return memo }) / temp_stats[param].length
		})

		_.each(['TP', 'FP', 'FN'], function(param, key, list){ 
			stats[param] = _.pluck(labelsstats, param)
			stats[param] = _.reduce(stats[param], function(memo, num){ return memo + num })
		})

		this.endTime = new Date();
		this.timeMillis = this.endTime-this.startTime;
		this.timePerSampleMillis = this.timeMillis / this.count;
		this.TP = stats.TP
		this.FP = stats.FP
		this.FN = stats.FN
		this.Accuracy = (this.TRUE) / (this.count);
		this.macroPrecision = temp_stats['Precision']
		this.macroRecall = temp_stats['Recall']
		this.macroF1 = temp_stats['F1']
		this.microPrecision = stats.TP / (stats.TP+stats.FP);
		this.microRecall = stats.TP / (stats.TP+stats.FN);
		this.microF1 = 2 / (1/this.microRecall + 1/this.microPrecision);
		this.HammingLoss = (stats.FN+stats.FP) / (stats.FN+stats.TP); // "the percentage of the wrong labels to the total number of labels"
		this.HammingGain = 1-this.HammingLoss;
		this.shortStatsString = sprintf("Accuracy=%d/%d=%1.0f%% HammingGain=1-%d/%d=%1.0f%% Precision=%1.0f%% Recall=%1.0f%% F1=%1.0f%% timePerSample=%1.0f[ms]",
this.TRUE, this.count, this.Accuracy*100, (this.FN+this.FP), (this.FN+this.TP), this.HammingGain*100, this.Precision*100, this.Recall*100, this.F1*100, this.timePerSampleMillis);
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



	
