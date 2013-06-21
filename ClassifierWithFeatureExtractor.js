var _ = require("underscore")._;

/**
 * ClassifierWithFeatureExtractor - A wrapper for a classifier and a feature-extractor.
 * 
 * @param opts
 * Must contain the option: 'classifierType' and 'featureExtractor'.
 * Can also contain the option 'classifierOptions' - options that will be sent to the base classifier.
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
	
	this.classifier = new this.classifierType(this.classifierOptions);
}

ClassifierWithFeatureExtractor.prototype = {

	/**
	 * Tell the classifier that the given sample belongs to the given classes.
	 * @param sample a document.
	 * @param classes an object whose KEYS are classes, or an array whose VALUES are classes.
	 */
	train: function(sample, classes) {
		sample = this.featureExtractor(sample);
		this.classifier.train(sample, classes);
	},

	/**
	 * Train the classifier with all the given documents.
	 * @param dataset an array with objects of the format: {input: sample1, output: [class11, class12...]}
	 */
	trainAll: function(data) {
		data = data.map(function(datum) {
          return _(_(datum).clone()).extend({ 
        	  input: this.featureExtractor(datum.input) });
        }, this);
		this.classifier.trainAll(data);
	},

	/**
	 * Use the model trained so far to classify a new sample.
	 * @param sample a document.
	 * @return an array whose VALUES are classes.
	 */
	classify: function(sample) {
		sample = this.featureExtractor(sample);
		return this.classifier.classify(sample);
	},
}

module.exports = ClassifierWithFeatureExtractor;
