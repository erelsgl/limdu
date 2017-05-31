/**
 * Static utility function for training and testing classifiers.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

var fs = require('fs');
var _ = require('underscore')._;
var hash = require('./hash');
var PrecisionRecall = require("./PrecisionRecall");
var list = require('./list');
var async = require('async');
var log_file = "/tmp/logs/" + process.pid;
console.vlog = function(data) {
    fs.appendFileSync(log_file, data + '\n', 'utf8')
};

/**
 * A short light-weight test function. Tests the given classifier on the given dataset, and 
 * writes a short summary of the mistakes and total performance.
 * @param explain level of explanations for mistakes (0 for none) 
 */

module.exports.testLite = function(classifier, testSet, explain) {
	var currentStats = new PrecisionRecall();
	
 	labeltree = {}

    if ((typeof classifier.TestSplitLabel === 'function')) {
		testSet = classifier.outputToFormat(testSet)
    }

    for (var i=0; i<testSet.length; ++i) {
		expectedClasses = list.listembed(testSet[i].output)
		classified = classifier.classify(testSet[i].input);

		actualClasses = list.listembed(classified)

		for (type in  classified.explanation)
		{
			for (label in classified.explanation[type])
				{
					if (!(label in labeltree))
						{
						labeltree[label] = {}
						labeltree[label]['positive'] = {}
						labeltree[label]['negative'] = {}
						}

					_.each(classified.explanation[type][label], function(value, key, list){ 
						if (!(value[0] in labeltree[label][type]))
							{
							labeltree[label][type][value[0]] = {}
							labeltree[label][type][value[0]]['count'] = 0
							labeltree[label][type][value[0]]['weight'] = 0
							}

						labeltree[label][type][value[0]]['count'] = labeltree[label][type][value[0]]['count']+ 1
						labeltree[label][type][value[0]]['weight'] = labeltree[label][type][value[0]]['weight'] + value[1]
						}, this)
				}
		}
	}

	for (label in labeltree)
	{
		for (type in labeltree[label])
		{
			lis = []

			for (label1 in labeltree[label][type])
			{
				lis.push([label1,labeltree[label][type][label1]['count'], labeltree[label][type][label1]['weight']])
			}

		labeltree[label][type]['LIST'] = _.sortBy(lis, function(num){ return Math.abs(num[2]); });
		}
	}


	for (label in labeltree)
	{
		for (type in labeltree[label])
		{
		console.log(label+" "+type)
		console.log(JSON.stringify(labeltree[label][type]['LIST'].reverse().slice(0,10), null, 4))
		}

	}


	console.log("SUMMARY: "+currentStats.calculateStats().shortStats());
	return currentStats;
};




/**
 * Test the given classifier on the given test-set.
 * @param classifier a (trained) classifier.
 * @param testSet array with objects of the format: {input: "sample1", output: "class1"}
 * @param verbosity [int] level of details in log (0 = no log)
 * @param microAverage, macroSum [optional; output] - objects of type PrecisionRecall, used to return the results. 
 * @return the currentStats.
 */
module.exports.test = function(
	classifier, testSet, 
	verbosity, microAverage, macroSum) {

	if (typeof classifier.OutputSplitLabel === 'function') {
		testSet = classifier.outputToFormat(testSet)
    }

	var currentStats = new PrecisionRecall();
	for (var i=0; i<testSet.length; ++i) {
		var expectedClasses = normalizeClasses(testSet[i].output);
		var actualClasses = classifier.classify(testSet[i].input);
		var explanations = currentStats.addCases(expectedClasses, actualClasses, (verbosity>2));
		//currentStats.addCasesLabels(expectedClasses, actualClasses);  // EREL: Not clear what this should do
		if (verbosity>1 && explanations.length>0) console.log("\t"+testSet[i].input+": \n"+explanations.join("\n"));
		if (microAverage) microAverage.addCases(expectedClasses, actualClasses);
	}
	currentStats.calculateStats();
	if (macroSum) hash.add(macroSum, currentStats.fullStats());
	return currentStats;
};

/**
 * Compare two classifiers on the same dataset. 
 * writes a short summary of the differences between them and total performance.
 * @param explain level of explanations for mistakes (0 for none) 
 */
module.exports.compare = function(classifier1, classifier2, dataset, explain) {
	var currentStats = []
	var data_stats = []


	explain = 50
	verbosity = explain

	testSetOriginal = utils.clonedataset(dataset)

	if ((typeof classifier1.TestSplitLabel === 'function')) {
		testSet1 = classifier1.outputToFormat(dataset)
    }
    else
    {
    	testSet1 = dataset
    }

    if ((typeof classifier2.TestSplitLabel === 'function')) {
		testSet2 = classifier2.outputToFormat(dataset)
    }
    else
    {
    	testSet2 = dataset
    }


	for (var i=0; i<testSetOriginal.length; ++i) 
	{
		expectedClasses = list.listembed(testSetOriginal[i].output)
		// expectedClasses2 = list.listembed(testSet2[i].output)

		// classified = classifier.classify(testSet[i].input, 50, testSet[i].input)
		classesWithExplanation1 = classifier1.classify(testSet1[i].input, explain, true, testSet1[i].output)
		classesWithExplanation2 = classifier2.classify(testSet2[i].input, explain, true, testSet2[i].output)


		if (explain > 0)
		{	
			classes1 = classesWithExplanation1.classes
			classes2 = classesWithExplanation2.classes
		}
		else
		{
			classes1 = classesWithExplanation1
			classes2 = classesWithExplanation2
		}

		actualClasses1 = list.listembed(classes1)
		actualClasses2 = list.listembed(classes2)

		_(expectedClasses.length).times(function(n){
			if (currentStats.length<n+1) 
				{	
				currentStats.push(new PrecisionRecall())
				data_stats.push([])
				}

			var sentence_hash = {}
			data_stats[n].push(sentence_hash);
			expl1 = currentStats[n].addCasesHash(expectedClasses[n], actualClasses1[n], (verbosity>2));
			expl2 = currentStats[n].addCasesHash(expectedClasses[n], actualClasses2[n], (verbosity>2));

			if (!(_.isEqual(expl1,expl2)))
				{
					console.log(testSetOriginal[i].input)
					console.log(expl1)
					console.log(expl2)
				}
			})	
		
	}
};



/**easy
 * Split the given dataset to two datasets: 
 ** easy (the classifier gets right), 
 ** and hard (the classifier errs).  
 */
module.exports.splitToEasyAndHard = function(classifier, dataset) {
	var easyDataset = [];
	var hardDataset = [];
	for (var i=0; i<dataset.length; ++i) {
		var expectedClasses = normalizeClasses(dataset[i].output); 
		var actualClasses = classifier.classify(dataset[i].input);
		actualClasses.sort();
		if (_(expectedClasses).isEqual(actualClasses)) {
			easyDataset.push(dataset[i]);
		} else {
			hardDataset.push(dataset[i]);
		}
	}
	return {easy: easyDataset, hard: hardDataset};
};

/**
 * Test the given classifier-type on the given train-set and test-set.
 * @param createNewClassifierFunction a function that creates a new, empty, untrained classifier
 * @param trainSet, testSet arrays with objects of the format: {input: "sample1", output: "class1"}
 * @param verbosity [int] level of details in log (0 = no log)
 * @param microAverage, vmacroSum [output] - objects of type PrecisionRecall, used to return the results. 
 * @return the currentStats.
 */
module.exports.trainAndTestLite = function(
		createNewClassifierFunction, 
		trainSet1, testSet1, 
		verbosity, microAverage, macroSum) {
		// TRAIN:

		trainSet = utils.clonedataset(trainSet1)
		testSet = utils.clonedataset(testSet1)

		var classifier = createNewClassifierFunction();

		if (verbosity>0) console.log("\nstart training on "+trainSet.length+" samples, "+(trainSet.allClasses? trainSet.allClasses.length+' classes': ''));
		var startTime = new Date();
		classifier.trainBatch(trainSet);
		var elapsedTime = new Date()-startTime;
		if (verbosity>0) console.log("end training on "+trainSet.length+" samples, "+(trainSet.allClasses? trainSet.allClasses.length+' classes, ': '')+elapsedTime+" [ms]");
	
		// TEST:
		return module.exports.testLite(classifier, testSet, /*explain=*/verbosity-1);
};

function label_enrichment(dataset, func)
	{	
		aggreg = []

		_.each(dataset, function(value, key, list){ 
			_.each(func(value.output), function(value1, key1, list){
				if (aggreg.length<=key1)
					aggreg.push([])
				aggreg[key1] = aggreg[key1].concat(value1) 
				}, this)
		}, this)

		_.each(aggreg, function(value, key, list){ 
			aggreg[key] = _.countBy(value, function(num) {return num});
			}, this)

		return aggreg
	}

/**
 * Test the given classifier-type on the given train-set and test-set and return a hash.
 * The only difference between trainAndTest_hash and trainAndTest is trainAndTest_hash doesn't allow inner console.log 
 * calls to test_hash method and allocate all statistics in hash, the method is still in development
 * @param createNewClassifierFunction a function that creates a new, empty, untrained classifier
 * @param trainSet, testSet arrays with objects of the format: {input: "sample1", output: "class1"}
 * @param verbosity [int] level of details in log (0 = no log)
 * @param microAverage, macroSum [output] - objects of type PrecisionRecall, used to return the results. 
 * @return the currentStats.
 * @author Vasily Konovalov
 */

// module.exports.trainAndTest_async = function(classifierType, trainSet, testSet, callback) {
module.exports.trainAndTest_async = function(classifierType, trainSet, testSet, callback) {

	var testSet_copy = JSON.parse(JSON.stringify(testSet))
	var trainSet_copy = JSON.parse(JSON.stringify(trainSet))

	var classifier = new classifierType()
	var trainStart = new Date().getTime()

	classifier.trainBatchAsync(trainSet_copy, function(err, results){
		var trainEnd = new Date().getTime()
		console.vlog("trained")
		// module.exports.test_hash(classifier, testSet, function(error, results){
		module.exports.testBatch_async(classifier, testSet_copy, function(error, results){
		// module.exports.test_async(classifier, testSet_copy, function(error, results){
			results['traintime'] = trainEnd - trainStart
			results['datafile'] = classifier.getDataFile()
			callback(null, results)
		})
	})
}



module.exports.trainAndTest_hash = function(
		classifierType, 
		trainSet, testSet, 
		verbosity) {
		var startTime = new Date();
		var classifier = new classifierType();
		TrainCountEmbed = true

		testSet1 = JSON.parse(JSON.stringify(testSet))
		trainSet1 = JSON.parse(JSON.stringify(trainSet))

		var trainStart = new Date().getTime()
		classifier.trainBatch(trainSet1);
		var trainEnd = new Date().getTime()
		console.log("classifier is trained")

		// stat_hash = module.exports.test_hash(classifier, testSet1, verbosity, microAverage, macroSum, classifier_compare);
		var stat_hash = module.exports.test_hash(classifier, testSet1, verbosity);

		stat_hash['traintime'] = trainEnd - trainStart
		
		return stat_hash;
};

/*
trainAndTest_batch is created solely for short text classification
*/


module.exports.cross_batch_async = function(classifierType, dataset, callback) {

	console.log("cross_batch: start "+dataset.length)

	var position = Math.round(dataset.length*0.5)
	var test = dataset.splice(position)

	module.exports.trainAndTest_async(classifierType, dataset, test, function(err, results){

		console.log("cross_batch: size of train="+dataset.length+ " size of test="+test.length)
		console.log("cross_batch:"+ JSON.stringify(results['stats']['intents']))

		callback(null, results['stats']['intents'])

	})
}


/**
 * Test the given classifier-type on the given train-set and test-set.
 * @param createNewClassifierFunction a function that creates a new, empty, untrained classifier
 * @param trainSet, testSet arrays with objects of the format: {input: "sample1", output: "class1"}
 * @param verbosity [int] level of details in log (0 = no log)
 * @param microAverage, macroSum [output] - objects of type PrecisionRecall, used to return the results. 
 * @return the currentStats.
 */
module.exports.trainAndTest = function(
		classifierType, 
		trainSet, testSet, 
		verbosity, microAverage, macroSum) {
		// TRAIN:
		var classifier = new classifierType();

		if (verbosity>0) console.log("\nstart training on "+trainSet.length+" samples, "+(trainSet.allClasses? trainSet.allClasses.length+' classes': ''));
		var startTime = new Date();
		classifier.trainBatch(trainSet);
		var elapsedTime = new Date()-startTime;
		if (verbosity>0) console.log("end training on "+trainSet.length+" samples, "+(trainSet.allClasses? trainSet.allClasses.length+' classes, ': '')+elapsedTime+" [ms]");
	
		// TEST:
		return module.exports.test(classifier, testSet, verbosity, microAverage, macroSum);
};

module.exports.trainAndCompare = function(
		createNewClassifier1Function, createNewClassifier2Function,
		trainSet, testSet, verbosity) {
		// TRAIN:
		var classifier1 = new createNewClassifier1Function();
		var classifier2 = new createNewClassifier2Function();

		trainSet1 = utils.clonedataset(trainSet)
		trainSet2 = utils.clonedataset(trainSet)

		if (verbosity>0) console.log("\nstart training on "+trainSet.length+" samples, "+(trainSet.allClasses? trainSet.allClasses.length+' classes': ''));
		var startTime = new Date();
		classifier1.trainBatch(trainSet1);
		var elapsedTime = new Date()-startTime;
		if (verbosity>0) console.log("end training on "+trainSet.length+" samples, "+(trainSet.allClasses? trainSet.allClasses.length+' classes, ': '')+elapsedTime+" [ms]");

		if (verbosity>0) console.log("start training on "+trainSet.length+" samples, "+(trainSet.allClasses? trainSet.allClasses.length+' classes': ''));
		var startTime = new Date();
		classifier2.trainBatch(trainSet2);
		var elapsedTime = new Date()-startTime;
		if (verbosity>0) console.log("end training on "+trainSet.length+" samples, "+(trainSet.allClasses? trainSet.allClasses.length+' classes, ': '')+elapsedTime+" [ms]");
	
		// TEST:
		return module.exports.compare(classifier1, classifier2, testSet, verbosity);
};


/**
 * Train on datasets[0], test on datasets[1].
 * Train on datasets[0+1], test on datasets[2].
 * Train on datasets[0+1+2], test on datasets[3].
 * etc...
 */
module.exports.learningCurve = function(createNewClassifierFunction, datasets, verbosity) {

	var trainSet = [];
	for (var i=1; i<datasets.length; ++i) {
		trainSet = trainSet.concat(datasets[i-1]);
		var testSet = datasets[i];

		var classifier = createNewClassifierFunction();
		var startTime = new Date();
		classifier.trainBatch(trainSet);
		var elapsedTime = new Date()-startTime;
		var testStats = module.exports.test(classifier, testSet, verbosity).shortStats();

		console.log("Train on "+trainSet.length+" samples ("+elapsedTime+" ms): "+testStats);
	}
};

var stringifyClass = function (aClass) {
	return (_(aClass).isString()? aClass: JSON.stringify(aClass));
};

var normalizeClasses = function (expectedClasses) {
	if (!_(expectedClasses).isArray())
		expectedClasses = [expectedClasses];
	expectedClasses = expectedClasses.map(stringifyClass);
	expectedClasses.sort();
	return expectedClasses;
};
