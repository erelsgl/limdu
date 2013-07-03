/**
 * Application for converting a JSON dataset with multiple classes per sample, to a JSON dataset with a single class per sample, by duplicating the samples
 */

var fs = require('fs');
var pathToFile = process.argv[2];
var dataset = JSON.parse(fs.readFileSync(pathToFile));

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

var newDataset = [];
dataset.forEach(function(sample) {
	sample.output.forEach(function(output) {
		newDataset.push({input: sample.input, output: output});
	});
});

write(newDataset);

