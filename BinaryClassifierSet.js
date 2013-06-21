var _ = require("underscore")._;

/**
 * BinaryClassifierSet - combines several binary classifiers to produce a multi-class classifier,
 * 	where each sample can belong to zero or more classes.
 * 
 * @param opts
 * Must contain the option 'binaryClassifierType' - the type of the base binary classifier.
 * Can also contain the option 'binaryClassifierOptions' - options that will be sent to the binary classifier constructor.
 */
var BinaryClassifierSet = function(opts) {
	if (!('binaryClassifierType' in opts)) {
		console.dir(opts);
		throw new Error("opts must contain binaryClassifierType");
	}
	if (!opts.binaryClassifierType) {
		console.dir(opts);
		throw new Error("opts.binaryClassifierType is null");
	}
	this.binaryClassifierType = opts.binaryClassifierType;
	this.binaryClassifierOptions = opts.binaryClassifierOptions;
	this.mapClassnameToClassifier = {};
}

BinaryClassifierSet.prototype = {
		
	/**
	 * Tell the classifier that the given classes will be used for the following samples, 
	 *   so that it will know to add negative samples to classes that do not appear.
	 * @param classes an object whose KEYS are classes, or an array whose VALUES are classes.
	 */
	addClasses: function(classes) {
		if (Array.isArray(classes)) classes=_.invert(classes);
		for (var aClass in classes)
			if (!this.mapClassnameToClassifier[aClass]) { 
				this.mapClassnameToClassifier[aClass] = 
					new this.binaryClassifierType(this.binaryClassifierOptions);
			}
	},
	
	makeSureClassifierExists: function (aClass) {
		if (!this.mapClassnameToClassifier[aClass]) {  // make sure classifier exists
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
		if (Array.isArray(classes)) classes=_.invert(classes);
		for (var positiveClass in classes) {
			this.makeSureClassifierExists(positiveClass);
			this.mapClassnameToClassifier[positiveClass].train(sample, 1);
		}
		for (var negativeClass in this.mapClassnameToClassifier) {
			if (!classes[negativeClass])
				this.mapClassnameToClassifier[negativeClass].train(sample, 0);
		}
	},

	/**
	 * Train the classifier with all the given documents.
	 * @param dataset an array with objects of the format: {input: sample1, output: [class11, class12...]}
	 */
	trainAll: function(dataset) {
		var mapClassnameToDataset = {};
		
		// create positive samples for each class:
		for (var i=0; i<dataset.length; ++i) {
			var sample = dataset[i].input;
			if (Array.isArray(dataset[i].output)) dataset[i].output=_.invert(dataset[i].output);
			var classes = dataset[i].output;
			for (var positiveClass in classes) {
				this.makeSureClassifierExists(positiveClass);
				if (!(positiveClass in mapClassnameToDataset))  // make sure dataset for this class exists
					mapClassnameToDataset[positiveClass] = [];
				mapClassnameToDataset[positiveClass].push({input: sample, output: 1})
			}
		}
		
		// create negative samples for each class (after all classes are in the array):
		for (var i=0; i<dataset.length; ++i) {
			var sample = dataset[i].input;
			var classes = dataset[i].output;
			for (var negativeClass in this.mapClassnameToClassifier) {
				if (!(negativeClass in mapClassnameToDataset))  // make sure dataset for this class exists
					mapClassnameToDataset[negativeClass] = [];
				if (!classes[negativeClass])
					mapClassnameToDataset[negativeClass].push({input: sample, output: 0})
			}
		}

		// train all classifiers:
		for (var aClass in mapClassnameToDataset) {
			this.mapClassnameToClassifier[aClass].trainAll(	
				mapClassnameToDataset[aClass]);
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
			if (classification>0.5)
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
