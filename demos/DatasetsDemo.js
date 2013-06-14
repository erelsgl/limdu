console.log("Datasets demo start");

var datasets = require('../datasets');

// A dummy dataset with 10 documents:
var dataset = [1,2,3,4,5,6,7,8,9,10];

console.log("5 partitions, with a test-set of 2 in each:");
datasets.partitions(dataset, 5, function(partition) {
	console.dir(partition);	
});
console.log("3 partitions, with a test-set of 3 in each:");
datasets.partitions(dataset, 3, function(partition) {
	console.dir(partition);	
});

console.log("Datasets demo end");
