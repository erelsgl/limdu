/**
 * Utilities for handling datasets of documents for training and testing.
 * 
 * Utilities include:
 * 
 * - read(pathToFile) 
 * - shuffle(dataset)
 * - partitions(dataset, numOfPartitions, callback)
 */

var fs = require('fs');
var _ = require("underscore")._;

/**
 * Read a dataset from a text file.
 *  
 * The file should contain lines, each line is a single classified sample:
 * 
 * sample1 / class11 AND class12 AND ...
 * sample2 / class21 AND ...
 * ...
 * 
 * Empty lines, and lines preceded with '#', are ignored.
 * 
 * @return an array where each item looks like:
 *   {input: "sample1", output: [class11, class12...]}
 * Additionally, the array has a field "allClasses", which is a 
 * sorted array of all different classes.
 */
exports.read = function(pathToFile) {
	var dataset=[];
	var lines = fs.readFileSync(pathToFile, 'utf8').split(/[\n\r]/g);
	var allClasses = {};
	for (var i=0; i<lines.length; ++i) {
		var line = lines[i].trim();
		if (/^#/.test(line) || line.length<1) 
			continue;
		var sampleAndClasses = line.split(/\s*\/\s*/);
		var sample = sampleAndClasses[0];
		var classes = sampleAndClasses[1].split(" AND ");
		dataset.push({input: sample, output: classes});
		for (var c=0; c<classes.length; ++c)
			allClasses[classes[c]]=true;
	}
	dataset.allClasses = Object.keys(allClasses);
	dataset.allClasses.sort();
	return dataset;
}


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


