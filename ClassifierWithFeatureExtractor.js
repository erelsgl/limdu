var _ = require("underscore")._;

/**
 * ClassifierWithFeatureExtractor - A wrapper for a classifier and a feature-extractor.
 * 
 * @param opts
 * Must contain the option: 'classifierType' and 'featureExtractor'.
 * May also contain the option 'classifierOptions' - options that will be sent to the base classifier.
 * May also contain the option 'featureLookupTable' - an instance of FeatureLookupTable for converting features to numeric indices and back.
 */
var ClassifierWithFeatureExtractor = function(opts) {
	if (!opts.classifierType) {
		console.dir(opts);
		throw new Error("opts must contain classifierType");
	}
	if (!opts.featureExtractor) {
		console.dir(opts);
		throw new Error("opts must contain featureExtractor");
	}
	this.classifierType = opts.classifierType;
	this.featureExtractor = opts.featureExtractor;
	this.classifierOptions = opts.classifierOptions;
	this.featureLookupTable = opts.featureLookupTable;
	
	this.classifier = new this.classifierType(this.classifierOptions);
}

ClassifierWithFeatureExtractor.prototype = {
		
	sampleToFeatures: function(sample) {
		var features = this.featureExtractor(sample);
		var array = features;
		if (this.featureLookupTable)
			array = this.featureLookupTable.hashToArray(features);
		//console.log(JSON.stringify(sample)+" => "+JSON.stringify(features)+" => "+JSON.stringify(array));
		return array;
	},

	/**
	 * Online training: 
	 * Tell the classifier that the given sample belongs to the given classes.
	 * @param sample a document.
	 * @param classes an object whose KEYS are classes, or an array whose VALUES are classes.
	 */
	train: function(sample, classes) {
		this.classifier.train(
			this.sampleToFeatures(sample), classes);
	},

	/**
	 * Batch training: 
	 * Train the classifier with all the given documents.
	 * @param dataset an array with objects of the format: {input: sample1, output: [class11, class12...]}
	 */
	trainAll: function(dataset) {
		var featureLookupTable = this.featureLookupTable;
		var featureExtractor = this.featureExtractor;
		dataset.forEach(function(datum) {
			datum.input = featureExtractor(datum.input);
			if (featureLookupTable)
				featureLookupTable.addFeatures(datum.input);
        });
		dataset.forEach(function(datum) {
			if (featureLookupTable)
				datum.input = featureLookupTable.hashToArray(datum.input);
		});
		this.classifier.trainAll(dataset, this.classifierOptions);
	},

	/**
	 * Use the model trained so far to classify a new sample.
	 * @param sample a document.
	 * @return an array whose VALUES are classes.
	 */
	classify: function(sample) {
		return this.classifier.classify(
			this.sampleToFeatures(sample));
	},
}

module.exports = ClassifierWithFeatureExtractor;
