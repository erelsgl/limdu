var hash = require("./hash");
var sprintf = require('sprintf').sprintf;

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
		if (expected==actual) this.TRUE;
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
	 * After the experiment is done, call this method to calculate the performance statistics.
	 */
	calculateStats: function() {
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
