/**
 * Utilities for partitioning datasets of documents for training and testing.
 * 
 * @author Erel Segal-haLevi
 * @since 2013-06
 */
var _ = require("underscore")._;


/**
 * Create a single partition of the given dataset.
 *
 * @param dataset an array.
 * @param testSetStart an index into the array.
 * @param testSetCount int - the num of samples in the test set, starting from testSetStart.
 * @return an object {train: trainSet, test: testSet}s
 */
exports.partition = function(dataset, testSetStart, testSetCount) {
		var datasetclone = JSON.parse(JSON.stringify(dataset));
		var testSet = datasetclone.splice(testSetStart, testSetCount);
		var trainSet = datasetclone; // without the test-set
		return {train: trainSet, test: testSet};
}

/**
 * Create several different partitions of the given dataset to train and test.
 * Useful for cross-validation. 
 * 
 * @param dataset any array.
 * @param numOfPartitions number of different partitions to generate.
 * @param callback a function to call for each partition.
 * 
 * @return an object: {train: [array-for-train], test: [array-for-test]}
 * @note code adapted from Heather Arthur:  https://github.com/harthur/classifier/blob/master/test/cross-validation/cross-validate.js
 */
exports.partitions = function(dataset, numOfPartitions, callback) {
	var shuffledDataset = _.shuffle(dataset);
	var testSetCount = dataset.length / numOfPartitions;
	
	for (var iPartition=0; iPartition<numOfPartitions; ++iPartition) {
		var testSetStart = iPartition*testSetCount;
		var partition = exports.partition(dataset, testSetStart, testSetCount);
		callback(partition.train, partition.test, iPartition);
	}
}

/**
 * Create several different partitions of the given dataset to train and test without doing shuffling
 * Useful for cross-validation in Threshold classifier.
 * 
*/

exports.partitions_consistent_by_fold = function(dataset, numOfPartitions, partitionIndex) {

	if (!_.isArray(dataset))
		throw new Error("dataset is not an array")

	if (_.isUndefined(numOfPartitions))
		throw new Error("numOfPartitions "+ numOfPartitions)

	if (_.isUndefined(partitionIndex))
		throw new Error("partitionIndex "+ partitionIndex)

	var testSetCount = dataset.length / numOfPartitions;

	var result = {'train': [], 'test': []}
	
	for (var iPartition=0; iPartition<numOfPartitions; ++iPartition) {
		var testSetStart = iPartition*testSetCount;
		var partition = exports.partition(dataset, testSetStart, testSetCount);

		if (iPartition == partitionIndex)
			{
				result['train'] = partition.train
				result['test'] = partition.test
			}
	}
	return result
}

exports.partitions_consistent = function(dataset, numOfPartitions, callback) {
	var testSetCount = dataset.length / numOfPartitions;
	
	for (var iPartition=0; iPartition<numOfPartitions; ++iPartition) {
		var testSetStart = iPartition*testSetCount;
		var partition = exports.partition(dataset, testSetStart, testSetCount);
		callback(partition.train, partition.test, iPartition);
	}
}

exports.partitions_reverese = function(dataset, numOfPartitions, callback) {
	var testSetCount = dataset.length / numOfPartitions;
	
	for (var iPartition=0; iPartition<numOfPartitions; ++iPartition) {
		var testSetStart = iPartition*testSetCount;
		var partition = exports.partition(dataset, testSetStart, testSetCount);
		callback(partition.test, partition.train, iPartition);
	}
}


exports.partitions_hash = function(datasetor, numOfPartitions, callback) {

	var count = datasetor[Object.keys(datasetor)[0]].length
	var testSetCount = Math.floor(count / numOfPartitions)

	for (var iPartition=0; iPartition<numOfPartitions; ++iPartition) {
		var testSetStart = iPartition*testSetCount;

		var dataset = JSON.parse(JSON.stringify(datasetor))

		var test = []
		var train = []

		_(count - testSetCount).times(function(n){ train.push([]) })
		
		_.each(dataset, function(value, key, list){ 
			test = test.concat(value.splice(testSetStart, testSetCount))
			_.each(value, function(elem, key1, list1){ 
				train[key1].push(elem)
			}, this)
		}, this)
	

		callback(train, test, iPartition);
	}
}


exports.partitions_hash_fold = function(datasetor, numOfPartitions, fold ) {

	var count = datasetor[Object.keys(datasetor)[0]].length
	var testSetCount = Math.floor(count / numOfPartitions)

	var testSetStart = fold*testSetCount;
	// var dataset = JSON.parse(JSON.stringify(datasetor))

	var test = []
	var train = []

	_(count - testSetCount).times(function(n){ train.push([]) })
		
	_.each(datasetor, function(value, key, list){ 
		test = test.concat(value.splice(testSetStart, testSetCount))
		_.each(value, function(elem, key1, list1){ 
			train[key1].push(elem)
		}, this)
	}, this)
	
	return {"train": train, "test": test}
}
