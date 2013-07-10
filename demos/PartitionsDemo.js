/**
 * Demonstrates partitioning datasets to train-set and test-set.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

console.log("Partitions demo start");

var partitions = require('../utils/partitions');

// A dummy dataset with 10 documents:
var dataset = [1,2,3,4,5,6,7,8,9,10];

console.log("5 partitions, with a test-set of 2 in each:");
partitions.partitions(dataset, 5, function(train, test, index) {
	console.log("\t"+index+": "+train+" / "+test);	
});
console.log("3 partitions, with a test-set of 3 in each:");
partitions.partitions(dataset, 3, function(train, test, index) {
	console.log("\t"+index+": "+train+" / "+test);	
});

console.log("Partitions demo end");
