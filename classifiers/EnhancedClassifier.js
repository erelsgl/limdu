/*
TODO: SpellChecker should be reorganized
*/

var async = require('async');
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
 * * 'OutputSplitLabel' - a method for special separation of output labels after classification.
 * * 'TestSplitLabel' - a method for special separation before a testing
 * * 'TfIdfImpl' - implementation of tf-idf algorithm
 * * 'tokenizer' - implementation of tokenizer
 * * 'featureExpansion' - a function that given the the list of known features generates the list of paraphrase features
 * * 'featureExpansionScale' - a list than defines the scale of feature expansion, it goes from high Precision to high Recall, can be used in chains
 * * 'featureExpansionPhrase' - a boolean, whether to explore only phrase-based expansion, this option measures the contribution of phrases
 * * 'featureFine' - a boolean, fine expanded features by similarity score.

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
	// this.setFeatureExtractor(opts.featureExtractor);
	this.featureExtractors = opts.featureExtractor;
	// this.setFeatureExtractorForClassification(opts.featureExtractorForClassification);
	// this.setFeatureLookupTable(opts.featureLookupTable);
	this.setFeatureLookupTable(new ftrs.FeatureLookupTable());

	this.setLabelLookupTable(opts.labelLookupTable);
	this.setInstanceFilter(opts.instanceFilter);

	// this.setFeatureExpansion(opts.featureExpansion);
	// this.featureExpansionScale = opts.featureExpansionScale;
	// this.featureExpansionPhrase = opts.featureExpansionPhrase;
	// this.featureFine = opts.featureFine;

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

	// this.spellChecker =  [require('wordsworth').getInstance(), require('wordsworth').getInstance()],
	// this.pastTrainingSamples = opts.pastTrainingSamples;
	// TODO: it looks like the method with creating an array at the definition 
	// create an array with the same pointer for every classifier of the given class
	
	this.pastTrainingSamples = []

	this.preProcessor = opts.preProcessor
	this.postProcessor = opts.postProcessor
	// this.TestSplitLabel = opts.TestSplitLabel

	this.featureOptions = opts.featureOptions
}


EnhancedClassifier.prototype = {

	setInstanceFilter: function (instanceFilter) {
		this.instanceFilter = instanceFilter;
	},

	/** Set the main feature extractor, used for both training and classification. */
	// setFeatureExtractor: function (featureExtractor) {
		// this.featureExtractors = ftrs.normalize(featureExtractor);
		// this.featureExtractors = ftrs.normalize(featureExtractor);
	// },

	// setFeatureExpansion: function (featureExpansion) {
		// this.featureExpansion = featureExpansion
	// },
	
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
			this.applyFeatureExpansion();
		}
	},

	applyFeatureExpansion: function(){
		console.log("start expansion generation")
	 	this.featureExpansioned = this.featureExpansion(this.featureLookupTable['featureIndexToFeatureName'], this.featureExpansionScale, this.featureExpansionPhrase)
	},
	// private function: use this.normalizers to normalize the given sample:
	normalizedSample: function(sample) {
		
	//	console.log(this.normalizers.length)
	//
	//	if (!(_.isArray(sample)))
	//	{
	//		if (this.normalizers) {
	//			try {
	//				for (var i in this.normalizers) {					
	//					console.log("inside norm")
	//					console.log(sample)
	//					sample = this.normalizers[i](sample);
	//					console.log("after norm")
	//					console.log(sample)
	//				}
	//			} catch (err) {
	//				console.log(err)
	//				throw new Error("Cannot normalize '"+sample+"': "+JSON.stringify(err));
	//			}
	//		}
	//	}
	//	

		sample = this.normalizers[0](sample)

		return sample;
	},

	sampleToFeaturesAsync: function(sample, featureExtractor, train, callback) {
		var features = {}

		async.eachSeries(featureExtractor, (function(FE, callback1){
            FE(sample, features, train, this.featureOptions, function(err, results){
                features = JSON.parse(JSON.stringify(results))
                callback1()
            })
        }).bind(this), function(err){
        	console.log("DEBUGFEATURES:"+JSON.stringify(features, null, 4))
            callback(null, features)
        })

		// features = {}
		// featureExtractor(sample, features, train, this.featureOptions, function(err, results){
			// console.log(JSON.stringify(results, null, 4))
  			// callback(null, results)
  		// })
    },

	sampleToFeatures: function(sample, featureExtractor) {
		var features = sample;
		if (featureExtractor) {
			try {
				features = {};
				featureExtractor(sample, features);
			} catch (err) {
				console.log(err)
				throw new Error("Cannot extract features from '"+sample+"': "+JSON.stringify(err));
			}
		}

		return features;
	},

	instanceFilterRun: function(data) {
		if (this.instanceFilter) 
			return this.instanceFilter(data)
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

				// Skip word2vec features
				if (typeof feature.match(/w2v/g) == "undefined" || feature.match(/w2v/g) == null)
					continue

				var IDF = this.tfidf.idf(feature)

				if (IDF != Infinity)
					features[feature] *= IDF
				else
					{
					console.error("Infinity "+feature)
					delete features[feature]
					}
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

	trainBatchAsync: function(dataset, callbackg) {
		var featureLookupTable = this.featureLookupTable;
		var pastTrainingSamples = this.pastTrainingSamples;

		var processed_dataset = []

		async.forEachOfSeries(dataset, (function(datum, dind, callback2){ 

			console.log(process.pid + " DEBUG: train instance "+datum.input.text+":"+datum.output)
			
			if (_.isObject(datum.input))
				datum.input.text = this.normalizedSample(datum.input.text);	
			else	
				datum.input = this.normalizedSample(datum.input);

			datum.input.unproc = datum.input.text

			if (typeof this.preProcessor === 'function')
			{
				datum = this.preProcessor(datum)
				console.log(process.pid+" DEBUG: preProcessor is finished Undefined? "+_.isUndefined(datum))
			}

			if (!_.isUndefined(datum))
			{
				this.sampleToFeaturesAsync(datum, this.featureExtractors, true, (function(err, features){
			
					// this.omitStopWords(features, this.stopwords)

					if (this.tfidf)
						this.tfidf.addDocument(features)
					
					if (featureLookupTable)
						featureLookupTable.addFeatures(features)

					datum.input = features
					processed_dataset.push(datum)

					callback2()
				}).bind(this))
			}
			else
			callback2()

		}).bind(this), (function(err){

//			processed_dataset = _.compact(processed_dataset)

			processed_dataset.forEach(function(datum) {
				this.editFeatureValues(datum.input, /*remove_unknown_features=*/false);
				if (featureLookupTable)
					datum.input = featureLookupTable.hashToArray(datum.input);
			}, this)

			this.classifier.trainBatch(processed_dataset)
			callbackg(null,[])
		
		}).bind(this))
	},

	/**
	 * Batch training: 
	 * Train the classifier with all the given documents.
	 * @param dataset an array with objects of the format: {input: sample1, output: [class11, class12...]}
	 */
	trainBatch: function(dataset) {
		var featureLookupTable = this.featureLookupTable;
		var pastTrainingSamples = this.pastTrainingSamples;

			// if (this.spellChecker) {
				// var seeds = []
				// var trainings = []
				// this.spellChecker[0].initializeSync(seeds.toString().split("\r\n"), trainings.toString().split("\r\n"))
			// }

			dataset = _.map(dataset, function(datum){ 
						if (_.isObject(datum.input))
							datum.input.text = this.normalizedSample(datum.input.text);
						else	
							datum.input = this.normalizedSample(datum.input);
						return datum
					}, this);
			
			if ((typeof this.preProcessor === 'function')) {
				// console.log(JSON.stringify(this.postProcessor, null, 4))
				dataset = _.map(dataset, function(value){ return this.preProcessor(value) }, this);
			}

			dataset = _.compact(dataset)

			dataset = dataset.map(function(datum) {

				// if (pastTrainingSamples && dataset!=pastTrainingSamples)
					// pastTrainingSamples.push(datum);
				datum = _(datum).clone();

				/*true - this instance is filtered as not useful*/
				// if (this.instanceFilterRun(datum) == true)
					// return null

				// this.trainSpellChecker(datum.input);

				// if (datum.output.length == 0)
				// {
					// console.log(JSON.stringify(datum, null, 4))
					// return null
				// }

				var features = this.sampleToFeatures(datum.input, this.featureExtractors);

				// this.omitStopWords(features, this.stopwords)
				
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

	classifyBatch: function(testSet)
        {
            _.each(testSet, function(value, key, list){
                testSet[key]["input"] = this.normalizedSample(testSet[key]["input"])
                var features = this.sampleToFeatures(testSet[key]["input"], this.featureExtractors, this.stopwords);
                // this.omitStopWords(features, this.stopwords)
                this.editFeatureValues(features, /*remove_unknown_features=*/false);
                var array = this.featuresToArray(features);
                testSet[key]["input"] = array
            }, this)
            return this.classifier.classifyBatch(testSet);
        },
	
	classifyPartAsync: function(sample, explain, callback) {
		
		this.sampleToFeaturesAsync(sample, this.featureExtractors, false, (function(err, features){

			console.log(process.pid+" DEBUGCLASSIFY: "+ JSON.stringify(features)+ " features")

			this.editFeatureValues(features, /*remove_unknown_features=*/false);
			var array = this.featuresToArray(features);

			console.log(process.pid+" DEBUGCLASSIFY: "+ array+ " features in array")
			
			var classification = this.classifier.classify(array, explain);

			console.log(JSON.stringify(classification, null, 4))

			classification['features'] = features
			callback(null, classification)
		}).bind(this))
	},

	classifyPart: function(sample, explain, continuous_output) {

		// var samplecorrected = this.correctFeatureSpelling(sample);

		var features = this.sampleToFeatures(sample, this.featureExtractors);

		// this.omitStopWords(features, this.stopwords)

		this.editFeatureValues(features, /*remove_unknown_features=*/false);

		var array = this.featuresToArray(features);

		var classification = this.classifier.classify(array, explain, continuous_output);
		
		// if (this.spellChecker && classification.explanation) {
			// if (Array.isArray(classification.explanation))
				// classification.explanation.unshift({SpellCorrectedFeatures: JSON.stringify(features)});
			// else
				// classification.explanation['SpellCorrectedFeatures']=JSON.stringify(features);
		// }

		classification['features'] = features

		return classification;
	},

	// outputToFormat: function(data) {
	// 	dataset = util.clonedataset(data)
	// 	dataset = dataset.map(function(datum) {
	// 	var normalizedLabels = multilabelutils.normalizeOutputLabels(datum.output);
	// 	return {
	// 		input: datum.input,
	// 		output: this.TestSplitLabel(normalizedLabels)
	// 	}
	// 	}, this);
	// 	return dataset
	// },
	
	classifyAsync: function(sample, explain, callback_global) {

		var classes = []
		
		if (_.isObject(sample)) 
			sample.text = this.normalizedSample(sample.text)
		else
			sample = this.normalizedSample(sample)

		async.series([
   			(function(callback){
       		
        		if(!this.inputSplitter) {

        			console.log(JSON.stringify("no split", null, 4))
        			console.log(JSON.stringify(sample, null, 4))

        			if (typeof this.preProcessor === 'function')
						sample = this.preProcessor(sample)

					this.classifyPartAsync(sample, explain, function(error, classesWithExplanation){
						classes = (explain>0? classesWithExplanation.classes: classesWithExplanation);
						var scores =  classesWithExplanation.scores
						// var scores =  (continuous_output? classesWithExplanation.scores: null)
						var explanations = (explain>0? classesWithExplanation.explanation: null);
						callback(null, null);
					});					
    
        		} else {
          			callback(null, null);
        		}
   			}).bind(this),
    		(function(callback){

    			if (typeof this.inputSplitter === 'function')
    			{

	          		var parts = this.inputSplitter(sample);
					var accumulatedClasses = [];
					var explanations = [];
			
					async.eachSeries(parts, (function(part, callback1){
						
						console.log(process.pid+" DEBUG: PART:"+part)

						if (part.length==0) return;

						var part_filtered = {}
						part_filtered.text = part
						part_filtered.context = sample.context
						part_filtered.sentences = sample.sentences
						part_filtered.unproc = part
						part_filtered.splitted = parts.length > 1

						if (typeof this.preProcessor === 'function')
							part_filtered.text = this.preProcessor(part)

						console.log(process.pid+" DEBUG: PART PREPROCESS:"+part_filtered.text)
						
						this.classifyPartAsync(part_filtered, explain, (function(error, classesWithExplanation){

							// var classes = (explain>0? classesWithExplanation.classes: classesWithExplanation);
							var classes = classesWithExplanation.classes

							console.log(classes)
							console.log(process.pid+" DEBUG: PART PREPROCESS CLASSES:"+classes)
					
							if (typeof this.postProcessor === 'function')
								classes = this.postProcessor(part, classes)

							console.log(process.pid+" DEBUG: PART POSTPROCESS CLASSES:"+classes)

							accumulatedClasses.push(classes)
							if (explain>0) 
								explanations.push(classesWithExplanation.explanation);

							callback1()
						}).bind(this))

				    }).bind(this), function(err){
				    	classes = _.flatten(accumulatedClasses)
				    	console.log(process.pid+" DEBUG: final classes: "+classes)   					
	             	   	callback(null, null)
	                })
        		} else {
          			callback(null, null);
        		}
    		}).bind(this)
		], function () {

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
			
    		callback_global(null, classes)
		})
	},

	/**
	 * Use the model trained so far to classify a new sample.
	 * @param sample a document.
	 * @return an array whose VALUES are classes.
	 * @original is the original gold standard labels is used only for statistics.
	 */
	classify: function(sample, explain) {

		console.log("To classify: ")
		console.log(JSON.stringify(sample, null, 4))

		var initial = sample
		
		if (_.isObject(sample)) 
			sample.text = this.normalizedSample(sample.text)
		else
			sample = this.normalizedSample(sample)


		console.log("Normalized")
		console.log(JSON.stringify(sample, null, 4))

		// if (this.instanceFilterRun(sample))
		// 	{	if (explain>0) 
		// 		return {
		// 			classes: [],
		// 			scores: {},
		// 			explanation: {} 
		// 			// bonus: bonus
		// 		};
		// 	else
		// 		return []
		// 	}		
		
		if (!this.inputSplitter) {

			if (typeof this.preProcessor === 'function')
				sample = this.preProcessor(sample)

			var classesWithExplanation = this.classifyPart(sample, explain);
			var classes = (explain>0? classesWithExplanation.classes: classesWithExplanation);
			var scores =  classesWithExplanation.scores
			// var scores =  (continuous_output? classesWithExplanation.scores: null)
			var explanations = (explain>0? classesWithExplanation.explanation: null);
		} else {
			var parts = this.inputSplitter(sample);
			// var accumulatedClasses = {};
			var accumulatedClasses = [];
			var explanations = [];
			parts.forEach(function(part) {

				console.log("PART:"+part)

				if (part.length==0) return;

				var part_filtered = part

				if (typeof this.preProcessor === 'function')
					part_filtered = this.preProcessor(part)

				console.log("PART PREPROCESS:"+part_filtered)

				var classesWithExplanation = this.classifyPart(part_filtered, explain);
				var classes = classesWithExplanation.classes

				console.log(JSON.stringify(classes, null, 4))
				console.log("PART PREPROCESS CLASSES:"+classes)
				
				if (typeof this.postProcessor === 'function')
					classes = this.postProcessor(part, classes)

				console.log("PART POSTPROCESS CLASSES:"+classes)

				// for (var i in classes)
				// 	accumulatedClasses[classes[i]]=true;
				accumulatedClasses.push(classes)
				if (explain>0) {
					// explanations.push(part);
					explanations.push(classesWithExplanation.explanation);
				}
			}, this);

			console.log("final classes")
			console.log(JSON.stringify(accumulatedClasses, null, 4))
			
   //  		classes = []
   //  		if (accumulatedClasses[0])
   //  		{
			// if (accumulatedClasses[0][0] instanceof Array)
			// 	_(accumulatedClasses[0].length).times(function(n){
			// 		classes.push(_.flatten(_.pluck(accumulatedClasses,n)))
			// 	 });
			// else
			// {
			classes = _.flatten(accumulatedClasses)
			// }
			// }
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

		if (explain>0) 
			return {
				classes: classes,
				scores: scores,
				// expansioned: classesWithExplanation.expansioned,
				// features: classesWithExplanation.features,
				// explanation: explanations
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
