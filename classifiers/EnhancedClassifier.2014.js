/*
TODO: SpellChecker should be reorganized
*/

var ftrs = require('../features');
var _ = require('underscore')._;
var hash = require('../utils/hash');
var util = require('../utils/list');
var multilabelutils = require('./multilabel/multilabelutils');

/**
 * EnhancedClassifier - wraps any classifier with feature-extractors and feature-lookup-tables.
 * 
 * @param opts
 * Obligatory option: 'classifierType', which is the base type of the classifier.
 * Optional:
 * * 'inputSplitter' - a function that splits the input samples into sub-samples, for multi-label classification (useful mainly for sentences). 
 * * 'normalizer' - a function that normalizes the input samples, before they are sent to feature extraction.
 * * 'featureExtractor' - a single feature-extractor (see the "features" folder), or an array of extractors, for extracting features from training and classification samples.
 * * 'featureExtractorForClassification' - additional feature extractor[s], for extracting features from samples during classification. Used for domain adaptation.
 * * 'featureLookupTable' - an instance of FeatureLookupTable for converting features (in the input) to numeric indices and back.
 * * 'labelLookupTable' - an instance of FeatureLookupTable for converting labels (classes, in the output) to numeric indices and back.
 * * 'multiplyFeaturesByIDF' - boolean - if true, multiply each feature value by log(documentCount / (1+featureDocumentFrequency))
 * * 'minFeatureDocumentFrequency' - int - if positive, ignore features that appeared less than this number in the training set.
 * * 'pastTrainingSamples' - an array that keeps all past training samples, to enable retraining.
 * * 'spellChecker' - an initialized spell checker from the 'wordsworth' package, to spell-check features during classification.
 * * 'bias' - a 'bias' feature with a constant value (usually 1).
 * * 'InputSplitLabel' - a method for special separation of input labels before training
 * * 'OutputSplitLabel' - a method for special separation of output labesl after classification.
 * * 'TestSplitLabel' - a method for special separation before a testing
 * * 'TfIdfImpl' - implementation of tf-idf algorithm
 * * 'tokenizer' - implementation of tokenizer
 * * 'instanceFilter' - filter of instance of training data and test data, if training instance is filtered is not used for training, if triaging instance is filtered by classify,
 it's classified empty class.
*/

var EnhancedClassifier = function(opts) {
	if (!opts.classifierType) {
		console.dir(opts);
		throw new Error("opts must contain classifierType");
	}

	this.classifier = new opts.classifierType();

	this.inputSplitter = opts.inputSplitter;
	this.setNormalizer(opts.normalizer);
	this.setFeatureExtractor(opts.featureExtractor);
	this.setFeatureExtractorForClassification(opts.featureExtractorForClassification);
	this.setFeatureLookupTable(opts.featureLookupTable);
	this.setLabelLookupTable(opts.labelLookupTable);

	this.multiplyFeaturesByIDF = opts.multiplyFeaturesByIDF;
	this.minFeatureDocumentFrequency = opts.minFeatureDocumentFrequency || 0;
	if (opts.multiplyFeaturesByIDF||opts.minFeatureDocumentFrequency) 
		{
    	this.tfidf = new opts.TfIdfImpl
		this.featureDocumentFrequency = {};
		}
	this.bias = opts.bias;

	this.spellChecker = opts.spellChecker;
	this.tokenizer = opts.tokenizer;
	this.instanceFilterRule = opts.instanceFilter

	// this.spellChecker =  [require('wordsworth').getInstance(), require('wordsworth').getInstance()],
	// this.pastTrainingSamples = opts.pastTrainingSamples;
	// TODO: it looks like the method with creating an array at the definition 
	// create an array with the same pointer for every classifier of the given class
	
	this.pastTrainingSamples = []

	this.InputSplitLabel = opts.InputSplitLabel
	this.OutputSplitLabel = opts.OutputSplitLabel
	this.TestSplitLabel = opts.TestSplitLabel
}


EnhancedClassifier.prototype = {

	/** Set the main feature extractor, used for both training and classification. */
	setFeatureExtractor: function (featureExtractor) {
		this.featureExtractors = ftrs.normalize(featureExtractor);
	},
	
	/** Set the main feature extractor, used for both training and classification. */
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
			this.featureExtractorsForClassification = new ftrs.CollectionOfExtractors(featureExtractorForClassification);
		}
	},
	
	setFeatureLookupTable: function(featureLookupTable) {
		if (featureLookupTable) {
			this.featureLookupTable = featureLookupTable;
			if (this.classifier.setFeatureLookupTable)
				this.classifier.setFeatureLookupTable(featureLookupTable);  // for generating clearer explanations only
		}
	},
	
	setLabelLookupTable: function(labelLookupTable) {
		if (labelLookupTable) {
			this.labelLookupTable = labelLookupTable;
			if (this.classifier.setLabelLookupTable)
				this.classifier.setLabelLookupTable(labelLookupTable);  // for generating clearer explanations only
		}
	},

	// private function: use this.normalizers to normalize the given sample:
	normalizedSample: function(sample) {
		if (!(_.isArray(sample)))
		{
			if (this.normalizers) {
				try {
					for (var i in this.normalizers) {					
						sample = this.normalizers[i](sample);
					}
				} catch (err) {
					console.log(err)
					throw new Error("Cannot normalize '"+sample+"': "+JSON.stringify(err));
				}
			}
		}

		return sample;
	},

	sampleToFeatures: function(sample, featureExtractor) {
		var features = sample;
		if (featureExtractor) {
			try {
				features = {};
				featureExtractor(sample, features);
			} catch (err) {
				throw new Error("Cannot extract features from '"+sample+"': "+JSON.stringify(err));
			}
		}

		return features;
	},

	instanceFilter: function(data) {
		if (this.instanceFilterRule) 
			return this.instanceFilterRule(data)
	},
	
	trainSpellChecker: function(features) {
		if (this.spellChecker) {
			var tokens = this.tokenizer.tokenize(features);
			_.each(tokens, function(word, key, list){ 
				this.spellChecker[1].understand(word); // Adds the given word to the index of the spell-checker.
				this.spellChecker[1].train(word);
			}, this)
		}
	},
	
	correctFeatureSpelling: function(sample) {
		if (this.spellChecker) {
			var features = this.tokenizer.tokenize(sample);
			for (var index in features) {
				var feature = features[index]
				if (!isNaN(parseInt(feature)))  // don't spell-correct numeric features
					{
					continue
					}
				
				if (!(this.spellChecker[1].exists(feature)))
					{
						if (this.spellChecker[1].suggest(feature).length != 0)
							{
							features[index] = this.spellChecker[1].suggest(feature)[0]
							}
						else
							{
								if (!(this.spellChecker[0].exists(feature)))
									{
										if (this.spellChecker[0].suggest(feature).length != 0)
											{
											features[index] = this.spellChecker[0].suggest(feature)[0]
											
											}
									}
							}
					}
			}
		sample = features.join(" ")
		}
		return sample
	},
	
	featuresToArray: function(features) {
		var array = features;
		if (this.featureLookupTable) {
			array = this.featureLookupTable.hashToArray(features);
		}
		return array;
	},
	
	countFeatures: function(features) {
		if (this.featureDocumentFrequency) {
			// this.tfidf.addDocument(datum.input);
			for (var feature in features)
				this.featureDocumentFrequency[feature] = (this.featureDocumentFrequency[feature] || 0)+1;
			this.documentCount = (this.documentCount||0)+1;
		}
	},
	
	editFeatureValues: function(features, remove_unknown_features) {

		if (this.multiplyFeaturesByIDF) { 
			for (var feature in features) { 
				var IDF = this.tfidf.idf(feature)
				if (IDF != Infinity)
					features[feature] *= IDF
				else
					delete features[feature]
			}

			if (this.bias && !features.bias)
			features.bias = this.bias;

		}
		// if (remove_unknown_features && this.minFeatureDocumentFrequency>0)
			// for (var feature in features)
				// if ((this.featureDocumentFrequency[feature]||0)<this.minFeatureDocumentFrequency)
					// delete features[feature];
		
	},
	

	/**
	 * Online training: 
	 * Tell the classifier that the given sample belongs to the given classes.
	 * @param sample a document.
	 * @param classes an array whose VALUES are classes.
	 */
	trainOnline: function(sample, classes) {
		classes = normalizeClasses(classes, this.labelLookupTable);
		sample = this.normalizedSample(sample);
		var features = this.sampleToFeatures(sample, this.featureExtractors);
		this.countFeatures(features);
		this.trainSpellChecker(features);
		this.editFeatureValues(features, /*remove_unknown_features=*/false);
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
		var featureLookupTable = this.featureLookupTable;
		var pastTrainingSamples = this.pastTrainingSamples;

			if (this.spellChecker) {
				// var seeds = fs.readFileSync('./node_modules/wordsworth/data/seed.txt')
				// var trainings = fs.readFileSync('./node_modules/wordsworth/data/training.txt')
				var seeds = []
				var trainings = []
				this.spellChecker[0].initializeSync(seeds.toString().split("\r\n"), trainings.toString().split("\r\n"))
				}

			dataset = dataset.map(function(datum) {

				if (typeof this.InputSplitLabel === 'function') {
					datum.output = (this.InputSplitLabel(multilabelutils.normalizeOutputLabels(datum.output)))	
				}
				else
				{
					datum.output = normalizeClasses(datum.output, this.labelLookupTable);
				}

				if (pastTrainingSamples && dataset!=pastTrainingSamples)
					pastTrainingSamples.push(datum);
				datum = _(datum).clone();

				datum.input = this.normalizedSample(datum.input);

				/*true - this instance is filtered as not useful*/
				if (this.instanceFilter(datum) == true)
					return null

				this.trainSpellChecker(datum.input);

				var features = this.sampleToFeatures(datum.input, this.featureExtractors);
				
				if (this.tfidf)
					this.tfidf.addDocument(features);
				// this.trainSpellChecker(features);
				if (featureLookupTable)
					featureLookupTable.addFeatures(features);

				datum.input = features;
				return datum;
			}, this);

			dataset = _.compact(dataset)

		dataset.forEach(function(datum) {
			// run on single sentence
			this.editFeatureValues(datum.input, /*remove_unknown_features=*/false);
			if (featureLookupTable)
				datum.input = featureLookupTable.hashToArray(datum.input);
		}, this);

		this.classifier.trainBatch(dataset);
	},

	/**
	 * internal function - classify a single segment of the input (used mainly when there is an inputSplitter) 
	 * @param sample a document.
	 * @return an array whose VALUES are classes.
	 */
	classifyPart: function(sample, explain, continuous_output) {
		
		var samplecorrected = this.correctFeatureSpelling(sample);
		var features = this.sampleToFeatures(samplecorrected, this.featureExtractors);
		this.editFeatureValues(features, /*remove_unknown_features=*/true);
		var array = this.featuresToArray(features);
		var classification = this.classifier.classify(array, explain, continuous_output);
		
		// if (this.spellChecker && classification.explanation) {
			// if (Array.isArray(classification.explanation))
				// classification.explanation.unshift({SpellCorrectedFeatures: JSON.stringify(features)});
			// else
				// classification.explanation['SpellCorrectedFeatures']=JSON.stringify(features);
		// }
		return classification;
	},

	outputToFormat: function(data) {
		dataset = util.clonedataset(data)
		dataset = dataset.map(function(datum) {
		var normalizedLabels = multilabelutils.normalizeOutputLabels(datum.output);
		return {
			input: datum.input,
			output: this.TestSplitLabel(normalizedLabels)
		}
		}, this);
		return dataset
	},

	/**
	 * Use the model trained so far to classify a new sample.
	 * @param sample a document.
	 * @return an array whose VALUES are classes.
	 * @original is the original gold standard labels is used only for statistics.
	 */
	classify: function(sample, explain, continuous_output, original, classifier_compare) {
		var initial = sample
		sample = this.normalizedSample(sample)

		if (this.instanceFilter(sample))
			{	if (explain>0) 
				return {
					classes: [],
					scores: {},
					explanation: {} 
					// bonus: bonus
				};
			else
				return []
			}		
		
		if (!this.inputSplitter) {
			var classesWithExplanation = this.classifyPart(sample, explain, continuous_output);
			var classes = (explain>0? classesWithExplanation.classes: classesWithExplanation);
			var scores =  (continuous_output? classesWithExplanation.scores: null)
			var explanations = (explain>0? classesWithExplanation.explanation: null);
		} else {
			var parts = this.inputSplitter(sample);
			// var accumulatedClasses = {};
			var accumulatedClasses = [];
			var explanations = [];
			parts.forEach(function(part) {
				if (part.length==0) return;
				var classesWithExplanation = this.classifyPart(part, explain, continuous_output);
				var classes = (explain>0? classesWithExplanation.classes: classesWithExplanation);
				// for (var i in classes)
				// 	accumulatedClasses[classes[i]]=true;
				accumulatedClasses.push(classes)
				if (explain>0) {
					// explanations.push(part);
					explanations.push(classesWithExplanation.explanation);
				}
			}, this);
    		classes = []
    		if (accumulatedClasses[0])
    		{
			if (accumulatedClasses[0][0] instanceof Array)
				_(accumulatedClasses[0].length).times(function(n){
					classes.push(_.flatten(_.pluck(accumulatedClasses,n)))
				 });
			else
			{
				classes = _.flatten(accumulatedClasses)
			}
			}
		}

		if (this.labelLookupTable) {
			if (Array.isArray(classes)) {
				classes = classes.map(function(label) {
						if (_.isArray(label))
							label[0] = this.labelLookupTable.numberToFeature(label[0]);
						else
							label = this.labelLookupTable.numberToFeature(label);
						return label;
					}, this);
			} else {
				classes = this.labelLookupTable.numberToFeature(classes);
			}
		}

		if ((typeof this.OutputSplitLabel === 'function')) {

			// classes = this.OutputSplitLabel(classes, this.Observable, sample, explanations)
			// var classes = []
			// if (_.isArray(explanations))
			// var bonus = []
		
			if ((explain>0) && (this.inputSplitter))
				{ nclasses = []
				_(explanations.length).times(function(n){
					var clas = this.OutputSplitLabel(classes, this, parts[n], explanations[n], original, classifier_compare, initial)
					nclasses = nclasses.concat(clas)
				}, this)
				classes = nclasses
				}
			else
				{
				var classes = this.OutputSplitLabel(classes, this, sample, explanations, original, classifier_compare, initial)
				}
			}

		if (explain>0) 
			return {
				classes: classes,
				scores: scores,
				explanation: explanations
				// bonus: bonus
			};
		else
			return classes;
	},

	
	/**
	 * Train on past training samples
	 * currently doesn't work
	 */
	retrain: function() {
		if (!this.pastTrainingSamples)
			throw new Error("No pastTrainingSamples array - can't retrain");
		
		this.trainBatch(this.pastTrainingSamples);
	},
	
	/**
	 * @return an array with all samples whose class is the given class.
	 * Available only if the pastTrainingSamples are saved.
	 */
	backClassify: function(theClass) {
		if (!this.pastTrainingSamples)
			throw new Error("No pastTrainingSamples array - can't backClassify");

		if (!(theClass instanceof Array))
			theClass = [theClass];
		var samples = [];
		this.pastTrainingSamples.forEach(function(datum) {
			if (_(datum.output).isEqual(theClass))
				samples.push(datum.input);
		});
		return samples;
	},

	toJSON : function(callback) {
		return {
			classifier: this.classifier.toJSON(callback),
			featureLookupTable: (this.featureLookupTable? this.featureLookupTable.toJSON(): undefined),
			labelLookupTable: (this.labelLookupTable? this.labelLookupTable.toJSON(): undefined),
			spellChecker:  (this.spellChecker? this.spellChecker/*.toJSON()*/: undefined),
			pastTrainingSamples: (this.pastTrainingSamples? this.pastTrainingSamples: undefined),
			featureDocumentFrequency: this.featureDocumentFrequency,
			documentCount: this.documentCount,
			/* Note: the feature extractors are functions - they should be created at initialization - they are not serializable! */ 
		};
	},

	fromJSON : function(json) {
		this.classifier.fromJSON(json.classifier);
		if (this.featureLookupTable) {
			this.featureLookupTable.fromJSON(json.featureLookupTable);
			this.setFeatureLookupTable(this.featureLookupTable);
		}
		if (this.labelLookupTable) {
			this.labelLookupTable.fromJSON(json.labelLookupTable);
			this.setLabelLookupTable(this.labelLookupTable);
		}
		if (this.spellChecker) this.spellChecker = json.spellChecker; 
		if (this.pastTrainingSamples) this.pastTrainingSamples = json.pastTrainingSamples;
		this.featureDocumentFrequency = json.featureDocumentFrequency;
		this.documentCount = json.documentCount;
		/* Note: the feature extractors are functions - they should be created at initialization - they are not deserializable! */ 
	},

	getAllClasses: function() {  // relevant for multilabel classifiers
		return this.classifier.getAllClasses();
	},
}  // end of EnhancedClassifier prototype


var stringifyClass = function (aClass) {
	return (_(aClass).isString()? aClass: JSON.stringify(aClass));
}

var normalizeClasses = function (classes, labelLookupTable) {
	if (!Array.isArray(classes))
		classes = [classes];
	classes = classes.map(stringifyClass);
	if (labelLookupTable)
		classes = classes.map(labelLookupTable.featureToNumber, labelLookupTable);
	classes.sort();
	return classes;
}

module.exports = EnhancedClassifier;
