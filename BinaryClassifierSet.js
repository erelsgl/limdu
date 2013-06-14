var associative = require("./associative");

/**
 * BinaryClassifierSet - combines several binary classifiers to produce a multi-class classifier,
 * 	where each sample can belong to zero or more classes.
 */

var BinaryClassifierSet = function(binaryClassifierType, binaryClassifierOptions, classifierSetOptions) {
	this.binaryClassifierType = binaryClassifierType;
	this.binaryClassifierOptions = binaryClassifierOptions;
	this.mapClassnameToClassifier = {};
}

BinaryClassifierSet.prototype = {
		
	/**
	 * Tell the classifier that the given classes will be used for the following samples, 
	 *   so that it will know to add negative samples to classes that do not appear.
	 * @param classes an object whose KEYS are classes, or an array whose VALUES are classes.
	 */
	addClasses: function(classes) {
		if (Array.isArray(classes)) classes=associative.fromArray(classes);
		for (var aClass in classes)
			if (!this.mapClassnameToClassifier[aClass]) { 
				this.mapClassnameToClassifier[aClass] = 
					new this.binaryClassifierType(this.binaryClassifierOptions);
			}
	},

	/**
	 * Tell the classifier that the given sample belongs to the given classes.
	 * @param sample a document.
	 * @param classes an object whose KEYS are classes, or an array whose VALUES are classes.
	 */
	train: function(sample, classes) {
		if (Array.isArray(classes)) classes=associative.fromArray(classes);
		for (var positiveClass in classes) {
			if (!this.mapClassnameToClassifier[positiveClass]) {  // classifier exists
				this.mapClassnameToClassifier[positiveClass] = 
					new this.binaryClassifierType(this.binaryClassifierOptions);
			}
			this.mapClassnameToClassifier[positiveClass].train(sample, 1);
		}
		for (var negativeClass in this.mapClassnameToClassifier) {
			if (!classes[negativeClass]) {
				this.mapClassnameToClassifier[negativeClass].train(sample, 0);
			}
		}
	},

	/**
	 * Use the model trained so far to classify a new sample.
	 * @param sample a document.
	 * @return an array whose VALUES are classes.
	 */
	classify: function(sample) {
		var classes = {};
		for (var aClass in this.mapClassnameToClassifier) {
			var classifier = this.mapClassnameToClassifier[aClass];
			var classification = classifier.classify(sample);
			//console.log("classification["+aClass+"]="+JSON.stringify(classification));
			if (classification==1)
				classes[aClass]=true;
		}
		return Object.keys(classes);
	},
	
	toJSON : function(callback) {
		var result = {}
		for (var aClass in this.mapClassnameToClassifier) {
			result[aClass]=this.mapClassnameToClassifier[aClass].toJSON(callback);
		}
		return result
	},

	fromJSON : function(json, callback) {
		for (var aClass in json) {
			this.mapClassnameToClassifier[aClass] =
				new this.binaryClassifierType(this.binaryClassifierOptions);
			this.mapClassnameToClassifier[aClass].fromJSON(json[aClass]);
		}
	    return this;
	},
}

module.exports = BinaryClassifierSet;
