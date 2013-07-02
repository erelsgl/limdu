/**
 * Utilities for handling datasets of documents for training and testing.
 * 
 * Utilities include:
 * 
 * - shuffle(dataset)
 * - partitions(dataset, numOfPartitions, callback)
 * 
 * @author Erel Segal-haLevi
 * @since 2013-06
 */

var _ = require("underscore")._;


/**
 * Randomly shuffle the given array.
 * 
 * @param dataset any array.
 * @note code adapted from Heather Arthur:  https://github.com/harthur/classifier/blob/master/test/cross-validation/cross-validate.js
 */
exports.shuffle = function(dataset) {
	return _(dataset).sortBy(function(num){
		return Math.random();
	});
}

/**
 * Partition the given array to two disjoint arrays - train and test.
 * 
 * @param dataset any array.
 * @param testSetStart index where the test-set starts.
 * @param testSetCount number of items in the test-set.
 * 
 * @return an object: {train: [array-for-train], test: [array-for-test]}
 * @note code adapted from Heather Arthur:  https://github.com/harthur/classifier/blob/master/test/cross-validation/cross-validate.js
 */
exports.partition = function(dataset, testSetStart, testSetCount) {
    var datasetclone = _(dataset).clone();
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
	var shuffledDataset = exports.shuffle(dataset);
	var testSetCount = dataset.length / numOfPartitions;
	
	for (var iPartition=0; iPartition<numOfPartitions; ++iPartition) {
		var partition = exports.partition (
			shuffledDataset, iPartition*testSetCount, testSetCount);
		callback(partition);
	}
}
