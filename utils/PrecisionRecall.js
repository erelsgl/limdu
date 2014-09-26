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
	this.count = 0;
	this.TP = 0;
	this.TN = 0;
	this.FP = 0;
	this.FN = 0;
	this.TRUE = 0;
	this.startTime = new Date();
	this.labels = {}
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

	 //  micro - average
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
			// if ((logTruePositives)&& (!only_false_cases)) explanations.push("\t\t*** ALL TRUE!");
			this.TRUE++;
		}
		this.count++;

		_.each(explanations, function(value, key, list){ 
			// explanations[key] = _.sortBy(explanations[key], function(num){ num });
			explanations[key].sort()
		}, this)

		return explanations;
	},

	// example of usage see in test
	addCasesHashSeq: function (expectedClasses, actualClasses, logTruePositives ) {

		var ex = []
		var ac = actualClasses

		_.each(expectedClasses['single_labels'], function(value, key, list){ 
			// if (value['position'][0].length > 0)
				_.each(value['position'], function(pos, key1, list1){
					ex.push([key, pos]) 
				}, this)
		}, this)

		// _.each(actualClasses['explanation'], function(value, key, list){ 
			// ac.push([value[0], value[2]])
		// }, this)

		var explanations = {};
		explanations['TP'] = []; explanations['FP'] = []; explanations['FN'] = [];

		// actualClasses = hash.normalized(actualClasses);
		// expectedClasses = hash.normalized(expectedClasses);

		// console.log(ac)
		// console.log(ex)
		// console.log()
		// process.exit(0)
		
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
						found = true
					else
						{
						if (this.intersection(ac[actualClassindex][1], exc[1]))
							found = true
						}
					}
			}, this)

			if (found) { 
				if (logTruePositives) explanations['TP'].push(ac[actualClassindex][0]);
				this.labels[ac[actualClassindex][0]]['TP'] += 1
				this.TP++
			} else {
				explanations['FP'].push(ac[actualClassindex][0]);
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

		_.each(explanations, function(value, key, list){ 
			// explanations[key] = _.sortBy(explanations[key], function(num){ num });
			explanations[key].sort()
		}, this)

		// console.log(explanations)
		// process.exit(0)
		return explanations;
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

		return this.labels
	},

	retrieveStats: function()
	{
		this.calculateStatsNoReturn()
		stats = {}
		stats['Accuracy'] = this.Accuracy
		stats['HammingLoss'] = this.HammingLoss
		stats['HammingGain'] = this.HammingGain
		stats['Precision'] = this.Precision
		stats['Recall'] = this.Recall
		stats['F1'] = this.F1
		stats['shortStatsString'] = this.shortStatsString
		return stats
	},

	calculateStatsNoReturn: function() {
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
