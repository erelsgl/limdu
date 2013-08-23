var FeaturesUnit = require('../features');
var _ = require('underscore')._;

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
 * * 'inputSplitter' - a function that splits the input samples into sub-samples, for multi-label classification (useful mainly for sentences). 
 * * 'spellChecker' - if true, use the 'wordsworth' spell checker to spell-check features during classification.
 */
var EnhancedClassifier = function(opts) {
	if (!opts.classifierType) {
		console.dir(opts);
		throw new Error("opts must contain classifierType");
	}
	this.classifierType = opts.classifierType;
	this.setNormalizer(opts.normalizer);
	this.setFeatureExtractor(opts.featureExtractor);
	this.setFeatureExtractorForClassification(opts.featureExtractorForClassification);
	this.classifierOptions = opts.classifierOptions;
	this.featureLookupTable = opts.featureLookupTable;
	this.pastTrainingSamples = opts.pastTrainingSamples;
	this.inputSplitter = opts.inputSplitter;
	
	if (opts.spellChecker) {
		this.spellChecker = require('wordsworth').getInstance();
	}
	
	this.classifier = new this.classifierType(this.classifierOptions);
}

EnhancedClassifier.prototype = {

	/** Set the main feature extactor, used for both training and classification. */
	setFeatureExtractor: function (featureExtractor) {
		this.featureExtractors = FeaturesUnit.normalize(featureExtractor);
	},
	
	/** Set the main feature extactor, used for both training and classification. */
	setNormalizer: function (normalizer) {
		if (normalizer)
			this.normalizers = (Array.isArray(normalizer)? normalizer: [normalizer]);
	},

	/** Set an additional feature extractor, for classification only. */
	setFeatureExtractorForClassification: function (featureExtractorForClassification) {
		if (featureExtractorForClassification) {
			if (Array.isArray(featureExtractorForClassification)) {
				featureExtractorForClassification.unshift(this.featureExtractors);
			} else {
				featureExtractorForClassification = [this.featureExtractors, featureExtractorForClassification];
			}
			this.featureExtractorsForClassification = new FeaturesUnit.CollectionOfExtractors(featureExtractorForClassification);
		}
	},
	
	// private function: use this.normalizers to normalize the given sample:
	normalizedSample: function(sample) {
		if (this.normalizers) {
			try {
				for (var i in this.normalizers) {
					sample = this.normalizers[i](sample);
				}
			} catch (err) {
				throw new Error("Cannot normalize '"+sample+"': "+JSON.stringify(err));
			}
		}
		return sample;
	},

	sampleToFeatures: function(sample, featureExtractor) {
		var features = sample;
		if (featureExtractor) {
			try {
				features = featureExtractor(sample);
			} catch (err) {
				throw new Error("Cannot extract features from '"+sample+"': "+JSON.stringify(err));
			}
		}
		return features;
	},
	
	trainSpellChecker: function(features) {
		if (this.spellChecker) {
			if (!_.isObject(features)) {
				throw new Error("The spell-checker cannot train because the 'features' are not organized as a hash");
			}
			for (var feature in features) {
				this.spellChecker.understand(feature); // Adds the given word to the index of the spell-checker.
				this.spellChecker.train(feature);      // Adds the given word to the probabilistic model of the spell-checker.
			}
		}
	},
	
	correctSpelling: function(features) {
		if (this.spellChecker) {
			if (!_.isObject(features)) {
				throw new Error("The spell-checker cannot correct because the 'features' are not organized as a hash");
			}
			var correctedFeatures = {};
			for (var feature in features) {
				var suggestions = this.spellChecker.suggest(feature); // If feature exists, returns empty. Otherwise, returns ordered list of suggested corrections from the training set.
				if (suggestions.length==0) {
					correctedFeatures[feature] = features[feature];
				} else { // take the first suggestion; but decrement its value a little:
					correctedFeatures[suggestions[0]] = features[feature] * 0.9;
				}
			}
			return correctedFeatures;
		} else {
			return features;
		}
	},
	
	featuresToArray: function(features) {
		var array = features;
		if (this.featureLookupTable) {
			array = this.featureLookupTable.hashToArray(features);
		}
		return array;
	},
	

	/**
	 * Online training: 
	 * Tell the classifier that the given sample belongs to the given classes.
	 * @param sample a document.
	 * @param classes an array whose VALUES are classes.
	 */
	trainOnline: function(sample, classes) {
		classes = normalizeClasses(classes);
		sample = this.normalizedSample(sample);
		var features = this.sampleToFeatures(sample, this.featureExtractors);
		this.trainSpellChecker(features);
		var array = this.featuresToArray(features);
		this.classifier.trainOnline(array, classes);
		if (this.pastTrainingSamples)
			this.pastTrainingSamples.push({input: sample, output: classes});
	},

	/**
	 * Batch training: 
	 * Train the classifier with all the given documents.
	 * @param dataset an array with objects of the format: {input: sample1, output: [class11, class12...]}
	 */
	trainBatch: function(dataset) {
		var self = this;
		var featureLookupTable = this.featureLookupTable;
		var pastTrainingSamples = this.pastTrainingSamples;

		dataset = dataset.map(function(datum) {
			datum.output = normalizeClasses(datum.output);
			if (pastTrainingSamples)
				pastTrainingSamples.push(datum);
			datum = _(datum).clone();
			datum.input = self.normalizedSample(datum.input);
			datum.input = self.sampleToFeatures(datum.input, self.featureExtractors);
			self.trainSpellChecker(datum.input);
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

	/**
	 * internal function - classify a single segment of the input (used mainly when there is an inputSplitter) 
	 * @param sample a document.
	 * @return an array whose VALUES are classes.
	 */
	classifyPart: function(sample, explain) {
		sample = this.normalizedSample(sample);
		var features = this.sampleToFeatures(sample, this.featureExtractorsForClassification? this.featureExtractorsForClassification: this.featureExtractors);
		features = this.correctSpelling(features);
		var array = this.featuresToArray(features);
		return this.classifier.classify(array, explain);
	},
	
	/**
	 * Use the model trained so far to classify a new sample.
	 * @param sample a document.
	 * @return an array whose VALUES are classes.
	 */
	classify: function(sample, explain) {
		if (!this.inputSplitter) {
			return this.classifyPart(sample, explain);
		} else {
			var parts = 	this.inputSplitter(sample);
			var accumulatedClasses = {};
			var explanations = [];
			var self = this;
			parts.forEach(function(part) {
				var classesWithExplanation = self.classifyPart(part,explain);
				var classes = (explain>0? classesWithExplanation.classes: classesWithExplanation);
				for (var i in classes)
					accumulatedClasses[classes[i]]=true;
				if (explain>0) {
					explanations.push(part);
					explanations.push(classesWithExplanation.explanation);
				}
			});
			classes = Object.keys(accumulatedClasses);
			if (explain>0) 
				return {
					classes: classes,
					explanation: explanations
				};
			else
				return classes;
		}
	},

	
	/**
	 * Train on past training samples
	 */
	retrain: function() {
		if (!this.pastTrainingSamples)
			throw new Error("No pastTrainingSamples array - can't retrain");
			
		var featureLookupTable = this.featureLookupTable;
		var featureExtractor = this.featureExtractors;
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

	getAllClasses: function() {  // relevant for multilabel classifiers
		return this.classifier.getAllClasses();
	},
}  // end of EnhancedClassifier prototype


var stringifyClass = function (aClass) {
	return (_(aClass).isString()? aClass: JSON.stringify(aClass));
}

var normalizeClasses = function (expectedClasses) {
	if (!Array.isArray(expectedClasses))
		expectedClasses = [expectedClasses];
	expectedClasses = expectedClasses.map(stringifyClass);
	expectedClasses.sort();
	return expectedClasses;
}

module.exports = EnhancedClassifier;
