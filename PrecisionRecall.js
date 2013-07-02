var _ = require("underscore")._;
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
	 * @param verbosity - if positive, also log the results. 
	 */
	addCases: function (expectedClasses, actualClasses, verbosity) {
		if (_.isArray(actualClasses))       actualClasses  =_.invert(actualClasses);
		else if (_.isString(actualClasses)) actualClasses  = {actualClasses: true};
		if (_.isArray(expectedClasses))       expectedClasses =_.invert(expectedClasses);
		else if (_.isString(expectedClasses)) expectedClasses = {expectedClasses: true};

		var allTrue = true;
		for (var actualClass in actualClasses) {
			if (actualClass in expectedClasses) { 
				if (verbosity>0) console.log("\t\t+++ TRUE POSITIVE: "+actualClass);
				this.TP++;
			} else {
				if (verbosity>0) console.log("\t\t--- FALSE POSITIVE: "+actualClass);
				this.FP++;
				allTrue = false;
			}
		}
		for (var expectedClass in expectedClasses) {
			if (!(expectedClass in actualClasses)) {
				if (verbosity>0) console.log("\t\t--- FALSE NEGATIVE: "+expectedClass);
				this.FN++;
				allTrue = false;
			}
		}
		if (allTrue) {
			if (verbosity>0) console.log("\t\t*** ALL TRUE!");
			this.TRUE++;
		}
		this.count++;
	},
	
	/**
	 * After the experiment is done, call this method to calculate the performance statistics.
	 */
	calculateStats: function() {
		this.Accuracy = (this.TRUE) / (this.count);
		this.Precision = this.TP / (this.TP+this.FP);
		this.Recall = this.TP / (this.TP+this.FN);
		this.F1 = 2 / (1/this.Recall + 1/this.Precision);
		this.endTime = new Date();
		this.timeMillis = this.endTime-this.startTime;
		this.timePerSampleMillis = this.timeMillis / this.count;
		return this;
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
		return sprintf("count=%d Accuracy=%1.0f%% F1=%1.0f%% timePerSample=%1.0f[ms]",
				this.count, this.Accuracy*100, this.F1*100, this.timePerSampleMillis);
	}
}

module.exports = PrecisionRecall;
