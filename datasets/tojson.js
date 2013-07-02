/**
 * Application for converting a dataset to JSON format.
 */

var fs = require('fs');

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
	var lines = fs.readFileSync(pathToFile, 'utf8').split(/[\n\r]/g);
	var allClasses = {};
	for (var i=0; i<lines.length; ++i) {
		var line = lines[i].trim();
		if (/^#/.test(line) || line.length<1) 
			continue; // skip comments and empty lines
		var sampleAndClasses = line.split(/\s*\/\s*/);
		var sample = sampleAndClasses[0];
		if (!sampleAndClasses[1]) {
			console.dir(sampleAndClasses);
			throw new Error("empty classes");
		}
		var classes = sampleAndClasses[1].split(" AND ");
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
