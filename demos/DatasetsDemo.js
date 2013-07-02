/**
 * Demonstrates partitioning datasets to train-set and test-set.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

console.log("Datasets demo start");

var datasets = require('../datasets');

// A dummy dataset with 10 documents:
var dataset = [1,2,3,4,5,6,7,8,9,10];

console.log("5 partitions, with a test-set of 2 in each:");
datasets.partitions(dataset, 5, function(train, test, index) {
	console.log("\t"+index+": "+train+" / "+test);	
});
console.log("3 partitions, with a test-set of 3 in each:");
datasets.partitions(dataset, 3, function(train, test, index) {
	console.log("\t"+index+": "+train+" / "+test);	
});

console.log("Datasets demo end");
