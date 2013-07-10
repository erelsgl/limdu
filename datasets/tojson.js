/**
 * Application for converting a dataset to JSON format.
 */

var fs = require('fs');
var hash = require('./hash');

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
var read = function(pathToFile) {
	var dataset=[];
	var allClasses = {};
	var datasetHash = hash.fromString(fs.readFileSync(pathToFile, 'utf8'));
	for (var sample in datasetHash) {
		var classes = datasetHash[sample].split(" AND ");
		dataset.push({input: sample, output: classes});
		for (var c=0; c<classes.length; ++c)
			allClasses[classes[c]]=true;
	}
	dataset.allClasses = Object.keys(allClasses);
	dataset.allClasses.sort();
	return dataset;
}

var write = function(json) {
	//console.log(JSON.stringify(json, null, "\t"))
	console.log("[");
	for (var i=0; i<json.length; ++i) {
		console.log(
			(i>0? ", ": "  ")+
			JSON.stringify(json[i]));
	}	
	console.log("]");
}


if (process.argc<1) {
	console.error("SYNTAX: node tojson <input>");
}
	
var pathToFile = process.argv[2];
write(read(pathToFile));
