/*
TODO: SpellChecker should be reorganized
*/

var ftrs = require('../features');
var _ = require('underscore')._;
var hash = require('../utils/hash');
var util = require('../utils/list');
var multilabelutils = require('./multilabel/multilabelutils');
var fs = require('fs');
var async = require('async');


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
	this.setFeatureExtractor(opts.featureExtractor);
	this.setFeatureExtractorForClassification(opts.featureExtractorForClassification);
	// this.setFeatureLookupTable(opts.featureLookupTable);
	this.setFeatureLookupTable(new ftrs.FeatureLookupTable());

	this.setLabelLookupTable(opts.labelLookupTable);
	this.setInstanceFilter(opts.instanceFilter);

	this.setFeatureExpansion(opts.featureExpansion);
	this.featureExpansionScale = opts.featureExpansionScale;
	this.featureExpansionPhrase = opts.featureExpansionPhrase;
	this.featureFine = opts.featureFine;
	this.expansionParam = opts.expansionParam;
	this.stopwords = opts.stopwords;

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

	this.InputSplitLabel = opts.InputSplitLabel
	this.OutputSplitLabel = opts.OutputSplitLabel
	this.TestSplitLabel = opts.TestSplitLabel

	// this.redis_buffer = {}
	// this.wordnet_buffer = {}
}


EnhancedClassifier.prototype = {

	setInstanceFilter: function (instanceFilter) {
		this.instanceFilter = instanceFilter;
	},

	/** Set the main feature extractor, used for both training and classification. */
	setFeatureExtractor: function (featureExtractor) {
		this.featureExtractors = ftrs.normalize(featureExtractor);
	},

	setFeatureExpansion: function (featureExpansion) {
		this.featureExpansion = featureExpansion
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
			this.applyFeatureExpansion();
		}
	},

	applyFeatureExpansion: function(){
		console.log("start expansion generation")
	 	this.featureExpansioned = this.featureExpansion(this.featureLookupTable['featureIndexToFeatureName'], this.featureExpansionScale, this.featureExpansionPhrase)
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

	sampleToFeatures_async: function(sample, featureExtractor, stopwords, callback) {
		
		features = {}

		featureExtractor(sample, features, stopwords, function(err, results){
			
			callback(err, features)
		})
	},


	sampleToFeatures: function(sample, featureExtractor, stopwords) {
		
		var features = sample;

		if (featureExtractor) {
			try {
				features = {};
				featureExtractor(sample, features, stopwords);
			} catch (err) {
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

				/*if (this.featureExpansioned)
				{
					if (feature in this.featureExpansioned)
					{	
						var feature_max = feature
						_.each(this.featureExpansioned[feature], function(value, key, list){ 
							if (this.tfidf.idf(value[0]) > this.tfidf.idf(feature_max)) 
								feature_max = value[0]
						}, this)
						delete features[feature]
						features[feature_max] = this.tfidf.idf(feature_max)
					}
				}*/
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
				if (this.instanceFilterRun(datum) == true)
					return null

				this.trainSpellChecker(datum.input);

				var features = this.sampleToFeatures(datum.input, this.featureExtractors, this.stopwords);

				this.omitStopWords(features, this.stopwords)
				
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

		if (this.featureExpansion)
			this.applyFeatureExpansion()

	},

	trainBatch_async: function(dataset, callbackg) {
		var featureLookupTable = this.featureLookupTable;
		var pastTrainingSamples = this.pastTrainingSamples;

		processed_dataset = []

		async.forEachOfSeries(dataset, (function(datum, dind, callback2){ 

			// console.log("trainBatch sample "+dind+" from "+dataset.length)

			datum.output = normalizeClasses(datum.output, this.labelLookupTable);
			datum = _(datum).clone();
			datum.input = this.normalizedSample(datum.input);
			
			this.sampleToFeatures_async(datum.input, this.featureExtractors, this.stopwords, (function(err, features){
				
				this.omitStopWords(features, this.stopwords)

				if (this.tfidf)
					this.tfidf.addDocument(features)
				
				if (featureLookupTable)
					featureLookupTable.addFeatures(features)

				datum.input = features
				processed_dataset.push(datum)

				callback2()
			}).bind(this))

		}).bind(this), (function(err){

			processed_dataset = _.compact(processed_dataset)

			processed_dataset.forEach(function(datum) {
			
				this.editFeatureValues(datum.input, /*remove_unknown_features=*/false);
				if (featureLookupTable)
					datum.input = featureLookupTable.hashToArray(datum.input);
			}, this)

			this.classifier.trainBatch(processed_dataset)
			callbackg(null,[])
		
		}).bind(this))

	},

	// fetching with buffering
	// fetchRedis: function(data, db)
	// {
	// 	if (data.length == 0)
	// 		return []

	// 	var execSync = require('execSync').exec

	// 	var redis_path = __dirname + '/../../nlu-server/utils/getred.js'
	// 	var buffer_path = __dirname + '/../../nlu-server/buffer.json'
		
	// 	if (this.redis_buffer_runs == 0)
	// 		this.redis_buffer = JSON.parse(fs.readFileSync(buffer_path,'UTF-8'))

	// 	if (!(db in this.redis_buffer))
	// 		this.redis_buffer[db] = {}

	// 	var data_reduced = []
	// 	_.each(data, function(value, key, list){ 
	// 		if (!(value in this.redis_buffer[db]))
	// 			data_reduced.push(value)
	// 	}, this)

	// 	// var data_reduced = _.filter(data, function(num){ _.has(this.redis_buffer, num) == false }, this)


	// 	if (data_reduced.length > 0)
	// 	{
	// 		console.log(data_reduced)
	// 		var cmd = "node " + redis_path + " " + JSON.stringify(data_reduced).replace(/[\[\]]/g, ' ').replace(/\"\,\"/g,'" "') + " " + db
	// 		console.log(cmd)
	// 		// result is hash
	// 		var result = JSON.parse(execSync(cmd)['stdout'])


	// 		_.each(result, function(value, key, list){ 
	// 			// this.redis_buffer[db][key] = {'data': value, 'count':0}
	// 			this.redis_buffer[db][key] = value
	// 		}, this)

	// 		this.redis_buffer_runs = this.redis_buffer_runs + 1

	// 		if (this.redis_buffer_runs % 10 == 0)
	// 		{
	// 			console.log("redis writing buffer ...")
 //            	fs.writeFileSync(buffer_path, JSON.stringify(this.redis_buffer, null, 4))
 //        	}
	// 	}

	// 	var data_result = []
	// 	_.each(data, function(value, key, list){ 

	// 		if (!(value in this.redis_buffer[db]))
	// 		{
	// 		console.log(value+' was not found in buffer')
	// 		process.exit(0)
	// 		}
	// 		data_result.push(this.redis_buffer[db][value])
	// 		// this.redis_buffer[db][value]['count'] += 1
	// 	}, this)

		

	// 	return data_result

	// },

	// fetchWordnet: function(word, relation)
	// {

	// 	var execSync = require('execSync').exec

	// 	var wordnet_path = __dirname + '/../../nlu-server/utils/getwordnet.js'
	// 	var buffer_path = __dirname + '/../../nlu-server/buffer_wordnet.json'

	// 	if (this.wordnet_buffer_runs == 0)
	// 		this.wordnet_buffer = JSON.parse(fs.readFileSync(buffer_path,'UTF-8'))

	// 	if (!(relation in this.wordnet_buffer))
	// 		this.wordnet_buffer[relation] = {}

	// 	if (!(word in this.wordnet_buffer[relation]))
	// 	{
	// 		var cmd =  "node " + wordnet_path + " \"" + word + "\""
	// 		console.log(cmd)
	// 		var candidates = JSON.parse(execSync(cmd)['stdout'])
	// 		this.wordnet_buffer[relation][word] = candidates
	// 		this.wordnet_buffer_runs = this.wordnet_buffer_runs + 1

	// 		if (this.wordnet_buffer_runs % 10 == 0)
	// 		{
	// 			console.log("wordnet writing buffer ...")
	//             fs.writeFileSync(buffer_path, JSON.stringify(this.wordnet_buffer, null, 4))
 //    	    }	
	// 	}

		

 //        return 	this.wordnet_buffer[relation][word]
	
	// },

	editWordnetExpansion: function(features, sample, callback){

		// console.log("expan")		

		// callback(null, [])

		// console.log("LEAK")

		_.each(features, function(value, key, list){ 
			delete features[key]
		}, this)

		var featureLookupTable = this.featureLookupTable
		var featureExpansioned = this.featureExpansioned

		var expansionParam = this.expansionParam
		var stopwords = this.stopwords

		var expansioned = {}

		async.forEachOfSeries(sample['CORENLP']['sentences'], function (sentence, senkey, callback1) {

			async.forEachOfSeries(sentence['tokens'], function (token, tokenkey, callback2) {

				// console.log("new token")
				// console.log(token)
				var feature = token['lemma'].toLowerCase()

				// console.log(feature)
			 
				if ((featureLookupTable['featureIndexToFeatureName'].indexOf(feature) != -1))
				{
					features[feature] = 1
					// console.log("token in train")
					callback2()
				}
				else
				{
					// console.log("not in train")

					if ((['ORGANIZATION', 'DATE', 'NUMBER', 'PERSON', 'DURATION'].indexOf(token['ner']) == -1) &&
						(stopwords.indexOf(feature) == -1) &&
						(['NN', 'NNS', 'NNP', 'NNPS'].indexOf(token['pos']) != -1) &&
						!(feature in features)
						)
					
					{

					// console.log("good token to proceed")

					expansioned[feature] = {'embedding_true': 0}
					expansioned[feature]['pos'] = token['pos']
					expansioned[feature]['word'] = token['word']
					expansioned[feature]['lemma'] = token['lemma']
					expansioned[feature]['ner'] = token['ner']

					expansionParam['redis_exec']([feature], 14, function(error, results){

						// console.log("sdad")

						feature_emb = results[0]

						if (feature_emb.length == 600)
						{
							// console.log("has embedding")

							expansioned[feature]['embedding_true'] = 1

							expansionParam['wordnet_exec'](feature, token['pos'], expansionParam['wordnet_relation'], function(error, results){

								var candidates = results
								// console.log("num of candidates before "+candidates.length)

								candidates  = _.map(candidates, function(value){ return value.toLowerCase() });
					 			candidates  = _.filter(candidates, function(value){ if (stopwords.indexOf(value) == -1) return value }, this);

					 			expansioned[feature]['wordnet_candidates'] = candidates

					 			candidates = _.filter(candidates, function(num){ return featureLookupTable['featureIndexToFeatureName'].indexOf(num)  != -1 });
					 			candidates = _.unique(candidates)

					 			// console.log("num of candidates after "+candidates.length)
					 			// console.log(candidates)

							 	if (candidates.length > 0)
							 	{
									expansioned[feature]['candidates_in_train'] = candidates
							
									expansionParam['redis_exec'](candidates, 14, 
											function(error,candidates_scores){

									// console.log("candidates with score "+candidates_scores.length)

									var candidates_with_scores = _.zip(candidates, candidates_scores)

									var candidates_with_scores_filtered = _.filter(candidates_with_scores, function(num){ return num[1].length>0 })

									if (candidates_with_scores_filtered.length > 0)
									{

										var candidates_filtered = _.map(candidates_with_scores_filtered, function(value){ return value[0]; });
									
										expansioned[feature]['candidates_with_emb'] = candidates_filtered

										var scores_filtered = _.map(candidates_with_scores_filtered, function(value){ return value[1]; });

										// if (expansionParam['context'] == true)
										// {

											var context = []

											_.each(sentence['collapsed-dependencies'], function(valuec, key, list){ 
												var tokenindex = parseInt(tokenkey) + 1
												if (tokenindex == parseInt(valuec['governor']))
												{
													if (token['word'].toLowerCase() == valuec['governorGloss'].toLowerCase())
														context.push(valuec['dep'].toLowerCase()+"_"+valuec['dependentGloss'].toLowerCase())
													else
														throw new Error(tokenindex +" "+ valuec['governor']+ JSON.stringify(token, null, 4) + JSON.stringify(valuec, null, 4))
												}

												if (tokenindex == parseInt(valuec['dependent']))
												{
													if (token['word'].toLowerCase() == valuec['dependentGloss'].toLowerCase())
														context.push(valuec['dep'].toLowerCase()+"I_"+valuec['governorGloss'].toLowerCase())
													else
														throw new Error(tokenindex +" "+ valuec['dependent']+JSON.stringify(token, null, 4) + JSON.stringify(valuec, null, 4) )
												}
											}, this)
									
											context = _.unique(context)

											// console.log("size of context "+context.length)

											expansioned[feature]['context'] = context

											// console.log("enter")

											expansionParam['redis_exec'](context, 13, function(error, context_scores){

												// console.log("context with emd "+context_scores.length)

												var context_scores = _.filter(context_scores, function(num){ return num.length>0 });
												// expansioned[feature]['context_with_emb'] = context_scores.length

												var rank = _.map(scores_filtered, function(value){ return  expansionParam['comparison'](feature_emb, value, context_scores)}, this)

												// console.log("rank size "+rank.length)

												var rank_with_candidates = _.zip(candidates_filtered, rank)

												rank_with_candidates = _.sortBy(rank_with_candidates, function(num)		{ return num[1] }).reverse()

												// expansioned[feature]['scores_with_context'] = rank_with_candidates
								
												// expansioned[feature]['expansion_with_context'] = [rank_with_candidates[0][0]]

												features[rank_with_candidates[0][0]] = 1

												// console.log("exit")
												callback2()


											})
									
										// }
										// else

											// var rank = _.map(scores_filtered, function(value){ return  expansionParam['comparison'](feature_emb, value)})

										
								// expansioned[feature] = rank_with_candidates[0][0]
									}
									else 
									callback2()
									})
								}
								else
								callback2()

							})
						}
						else
						callback2()

					})
				}
				else
				callback2()
			}
		
		}, function (err) {
			  callback1()
			})

		}, function (err) {
			  callback(err, expansioned)
			})
	},

	editFeatureExpansion: function(features){
		var featureLookupTable = this.featureLookupTable
		var featureExpansioned = this.featureExpansioned

		var expansioned = {}

		_.each(features, function(value, feature, list){
			 if (featureLookupTable['featureIndexToFeatureName'].indexOf(feature) == -1)
			 {
			 	if (feature in featureExpansioned)
			 		{
			 			delete features[feature]
			 			var syn_feature = featureExpansioned[feature][0]
			 			
			 			features[syn_feature[0]] = 1

			 			if (this.featureFine)
			 				features[syn_feature[0]] = 1/Math.log(syn_feature[2])

			 			if (featureLookupTable['featureIndexToFeatureName'].indexOf(syn_feature[0]) == -1)
			 				{
			 				console.error("sanity check "+ feature+" -> "+syn_feature[0])
			 				console.error(JSON.stringify(featureLookupTable, null, 4))
			 				}
			 			console.log("-expansion from '"+ feature + "' to '"+ featureExpansioned[feature][0][0]+"'")
			 			expansioned[feature] = featureExpansioned[feature][0][0]
			 		}
			 }
		}, this)

		return expansioned
	},

	omitStopWords: function(features, stopwords)
	{
		if (stopwords)
		if (stopwords.length > 0)
		{
			_.each(features, function(value, key, list){ 
				if (stopwords.indexOf(key) != -1)
					delete features[key]
			}, this)
		}
	},

	/**
	 * internal function - classify a single segment of the input (used mainly when there is an inputSplitter) 
	 * @param sample a document.
	 * @return an array whose VALUES are classes.
	 */

	classifyPart_async: function(sample, callbackm) {
			
	var features = {}

	async.waterfall([
    	(function(callback) {
			this.sampleToFeatures_async(sample, this.featureExtractors, this.stopwords, function(err, results){
				features = results
				callback()
			})
		}).bind(this),
    	(function(callback12) {

			if (this.expansionParam)
			{
				this.editWordnetExpansion(features, sample, function(error, expansioned){
					callback12(error, expansioned)
				})
			}
			else
				callback12(null, [])

    	}).bind(this),

    	(function(expansioned, callback2) {

		this.omitStopWords(features, this.stopwords)

		this.editFeatureValues(features, /*remove_unknown_features=*/false);

		var array = this.featuresToArray(features);

		var classification = this.classifier.classify(array, 50, 50);

			// classification['expansioned'] = expansioned
		classification['features'] = features

			callback2(null ,classification)
    	}).bind(this)
	], function (err, result) {
		callbackm(err, result)
	})
	
	},

	classifyPart: function(sample, explain, continuous_output) {

		// var samplecorrected = this.correctFeatureSpelling(sample);

		var features = this.sampleToFeatures(sample, this.featureExtractors, this.stopwords);

		var expansioned = {}
		
		// if (this.featureExpansion)
			// expansioned = this.editFeatureExpansion(features);

		// if (this.expansionParam)
			// expansioned = this.editWordnetExpansion(features, sample)
		// else
			// console.log("No expansion")

		this.omitStopWords(features, this.stopwords)

		this.editFeatureValues(features, /*remove_unknown_features=*/false);

		var array = this.featuresToArray(features);

		var classification = this.classifier.classify(array, explain, continuous_output);
		
		// if (this.spellChecker && classification.explanation) {
			// if (Array.isArray(classification.explanation))
				// classification.explanation.unshift({SpellCorrectedFeatures: JSON.stringify(features)});
			// else
				// classification.explanation['SpellCorrectedFeatures']=JSON.stringify(features);
		// }

		classification['expansioned'] = expansioned
		classification['features'] = features

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


	classify_async: function(sample, original, callback)
	{
		var normalized = this.normalizedSample(sample)

		this.classifyPart_async(normalized, function(error, classesWithExplanation){

			var classes = classesWithExplanation.classes
			var scores =  classesWithExplanation.scores
			var explanations = classesWithExplanation.explanation

			callback(error, {
				classes: classes,
				scores: scores,
				expansioned: classesWithExplanation.expansioned,
				features: classesWithExplanation.features,
				explanation: explanations
			})

		})
	},

		// if (this.labelLookupTable) {
		// 	if (Array.isArray(classes)) {
		// 		classes = classes.map(function(label) {
		// 				if (_.isArray(label))
		// 					label[0] = this.labelLookupTable.numberToFeature(label[0]);
		// 				else
		// 					label = this.labelLookupTable.numberToFeature(label);
		// 				return label;
		// 			}, this);
		// 	} else {
		// 		classes = this.labelLookupTable.numberToFeature(classes);
		// 	}
		// }

	/**
	 * Use the model trained so far to classify a new sample.
	 * @param sample a document.
	 * @return an array whose VALUES are classes.
	 * @original is the original gold standard labels is used only for statistics.
	 */
	classify: function(sample, explain, continuous_output, original, classifier_compare) {
		var initial = sample
		sample = this.normalizedSample(sample)

		if (this.instanceFilterRun(sample))
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
				expansioned: classesWithExplanation.expansioned,
				features: classesWithExplanation.features,
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
