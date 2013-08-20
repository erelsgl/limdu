var FeaturesUnit = require('../features');

/**
 * EnhancedClassifier - wraps any classifier with feature-extractors and feature-lookup-tables.
 * 
 * @param opts
 * Obligatory option: 'classifierType', which is the base type of the classifier.
 * Optional:
 * * 'classifierOptions' - options that will be sent to the base classifier.
 * * 'normalizer' - a function that normalizes the input samples, before they are sent to feature extraction.
 * * 'featureExtractor' - a single feature-extractor (see the "features" folder), or an array of extractors, for extracting features from training and classification samples.
 * * 'featureExtractorForClassification' - additional feature extractor[s], for extracting features from samples during classification. Used for domain adaptation.
 * * 'featureLookupTable' - an instance of FeatureLookupTable for converting features to numeric indices and back.
 * * 'pastTrainingSamples' - an array that keeps all past training samples, to enable retraining. 
 */
var EnhancedClassifier = function(opts) {
	if (!opts.classifierType) {
		console.dir(opts);
		throw new Error("opts must contain classifierType");
	}
	this.classifierType = opts.classifierType;
	this.normalizer = opts.normalizer;
	this.setFeatureExtractor(opts.featureExtractor);
	this.setFeatureExtractorForClassification(opts.featureExtractorForClassification);
	this.classifierOptions = opts.classifierOptions;
	this.featureLookupTable = opts.featureLookupTable;
	this.pastTrainingSamples = opts.pastTrainingSamples;
	
	this.classifier = new this.classifierType(this.classifierOptions);
}

EnhancedClassifier.prototype = {

	/** Set the main feature extactor, used for both training and classification. */
	setFeatureExtractor: function (featureExtractor) {
		this.featureExtractor = FeaturesUnit.normalize(featureExtractor);
	},

	/** Set an additional feature extractor, for classification only. */
	setFeatureExtractorForClassification: function (featureExtractorForClassification) {
		if (featureExtractorForClassification) {
			if (_(featureExtractorForClassification).isArray()) {
				featureExtractorForClassification.unshift(this.featureExtractor);
			} else {
				featureExtractorForClassification = [this.featureExtractor, featureExtractorForClassification];
			}
			this.featureExtractorForClassification = new CollectionOfExtractors(featureExtractorForClassification);
		}
	},

	sampleToFeatures: function(sample, featureExtractor) {
		if (this.normalizer) {
			try {
				sample = this.normalizer(sample);
			} catch (err) {
				throw new Error("Cannot normalize '"+sample+"': "+JSON.stringify(err));
			}
		}
		var features = sample;
		if (featureExtractor) {
			try {
				features = featureExtractor(sample);
			} catch (err) {
				throw new Error("Cannot extract features from '"+sample+"': "+JSON.stringify(err));
			}
		}
		var array = features;
		if (this.featureLookupTable)
			array = this.featureLookupTable.hashToArray(features);
		return array;
	},

	getAllClasses: function() {  // relevant for multilabel classifiers
		return this.classifier.getAllClasses();
	},

	/**
	 * Online training: 
	 * Tell the classifier that the given sample belongs to the given classes.
	 * @param sample a document.
	 * @param classes an array whose VALUES are classes.
	 */
	trainOnline: function(sample, classes) {
		classes = normalizeClasses(classes);
		this.classifier.trainOnline(
			this.sampleToFeatures(sample, this.featureExtractor), classes);
		if (this.pastTrainingSamples)
			this.pastTrainingSamples.push({input: sample, output: classes});
	},

	/**
	 * Batch training: 
	 * Train the classifier with all the given documents.
	 * @param dataset an array with objects of the format: {input: sample1, output: [class11, class12...]}
	 */
	trainBatch: function(dataset) {
		var normalizer = this.normalizer;
		var featureExtractor = this.featureExtractor;
		var featureLookupTable = this.featureLookupTable;
		var pastTrainingSamples = this.pastTrainingSamples;

		dataset = dataset.map(function(datum) {
			datum.output = normalizeClasses(datum.output);
			if (pastTrainingSamples)
				pastTrainingSamples.push(datum);
			datum = _(datum).clone();
			if (normalizer)
				datum.input = normalizer(datum.input);
			if (featureExtractor)
				datum.input = featureExtractor(datum.input);
			if (featureLookupTable)
				featureLookupTable.addFeatures(datum.input);
			return datum;
		});
		dataset.forEach(function(datum) {
			if (featureLookupTable)
				datum.input = featureLookupTable.hashToArray(datum.input);
		});
		this.classifier.trainBatch(dataset, this.classifierOptions);
	},

	retrain: function() {
		if (!this.pastTrainingSamples)
			throw new Error("No pastTrainingSamples array - can't retrain");
			
		var featureLookupTable = this.featureLookupTable;
		var featureExtractor = this.featureExtractor;
		var dataset = this.pastTrainingSamples;

		dataset = dataset.map(function(datum) {
			datum = _(datum).clone();
			if (normalizer)
				datum.input = normalizer(datum.input);
			if (featureExtractor)
				datum.input = featureExtractor(datum.input);
			if (featureLookupTable)
				datum.input = featureLookupTable.hashToArray(datum.input);
			return datum;
		});
		this.classifier.trainBatch(dataset, this.classifierOptions);
	},

	/**
	 * Use the model trained so far to classify a new sample.
	 * @param sample a document.
	 * @return an array whose VALUES are classes.
	 */
	classify: function(sample, explain) {
		return this.classifier.classify(
			this.sampleToFeatures(sample, this.featureExtractorForClassification? this.featureExtractorForClassification: this.featureExtractor), explain);
	},
	
	/**
	 * @return an array with all samples whose class is the given class.
	 * Available only if the pastTrainingSamples are saved.
	 */
	backClassify: function(theClass) {
		if (!this.pastTrainingSamples)
			throw new Error("No pastTrainingSamples array - can't backClassify");

		//console.log("\tbackClassify "+JSON.stringify(theClass));
		if (!(theClass instanceof Array))
			theClass = [theClass];
		var samples = [];
		this.pastTrainingSamples.forEach(function(datum) {
			//console.log("\t\tChecking "+datum.output);
			if (_(datum.output).isEqual(theClass))
				samples.push(datum.input);
		});
		return samples;
	},

	toJSON : function(callback) {
		return {
			classifier: this.classifier.toJSON(callback),
			featureLookupTable: (this.featureLookupTable? this.featureLookupTable.toJSON(): undefined),
			pastTrainingSamples: (this.pastTrainingSamples? this.pastTrainingSamples: undefined),
			/* Note: the feature extractors are functions - they should be created at initialization - they cannot be serialized! */ 
		};
	},

	fromJSON : function(json) {
		this.classifier.fromJSON(json.classifier);
		if (this.featureLookupTable) this.featureLookupTable.fromJSON(json.featureLookupTable);
		if (this.pastTrainingSamples) this.pastTrainingSamples = json.pastTrainingSamples;
		
		/* Note: the feature extractors are functions - they should be created at initialization - they cannot be deserialized! */ 
		return this;
	},
}  // end of EnhancedClassifier prototype


var stringifyClass = function (aClass) {
	return (_(aClass).isString()? aClass: JSON.stringify(aClass));
}

var normalizeClasses = function (expectedClasses) {
	if (!_(expectedClasses).isArray())
		expectedClasses = [expectedClasses];
	expectedClasses = expectedClasses.map(stringifyClass);
	expectedClasses.sort();
	return expectedClasses;
}

module.exports = EnhancedClassifier;
