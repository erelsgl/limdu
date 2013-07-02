/**
 * Utilities for handling datasets of documents for training and testing.
 * 
 * Utilities include:
 * 
 * - partitions(dataset, numOfPartitions, callback)
 * 
 * @author Erel Segal-haLevi
 * @since 2013-06
 */

var _ = require("underscore")._;

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
		var datasetclone = _(shuffledDataset).clone();
		var testSetStart = iPartition*testSetCount;
		var testSet = datasetclone.splice(testSetStart, testSetCount);
		var trainSet = datasetclone; // without the test-set
		callback(trainSet, testSet, iPartition);
	}
}
