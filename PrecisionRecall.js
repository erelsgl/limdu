var associative = require("./associative");
var sprintf = require('sprintf').sprintf;

/**
 * PrecisionRecall - an object for tracking results of experiments.
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
	 * Record the result of a new binary experiment 
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
	 * @param verbosity - if positive, also log the results. 
	 */
	addCases: function (expectedClasses, actualClasses, verbosity) {
		if (Array.isArray(actualClasses))   actualClasses  =associative.fromArray(actualClasses);
		if (Array.isArray(expectedClasses)) expectedClasses=associative.fromArray(expectedClasses);
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
	
	calculateStats: function() {
		this.Accuracy = (this.TRUE)/(this.count);
		this.Precision = this.TP/(this.TP+this.FP);
		this.Recall = this.TP/(this.TP+this.FN);
		this.F1 = 2/(1/this.Recall+1/this.Precision);
		this.endTime = new Date();
		this.timeMillis = this.endTime-this.startTime;
		this.timePerSampleMillis = this.timeMillis/this.count;
		return this;
	},
	
	fullStats: function() { 
		return this; 
	},
	
	shortStats: function() {
		return sprintf("count=%d Accuracy=%1.0f%% F1=%1.0f%% timePerSample=%1.0f[ms]",
				this.count, this.Accuracy*100, this.F1*100, this.timePerSampleMillis);
	}
}

module.exports = PrecisionRecall;
