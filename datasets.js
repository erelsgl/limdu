/**
 * dataset - a map between sample strings and classes.
 * Each sample can belong to zero or more classes.
 */

var fs = require('fs');

/**
 * The file should contain lines, each line is a single classified sample:
 * 
 * sample1 / class11 AND class12 AND ...
 * sample2 / class21 AND ...
 * ...
 * 
 * Lines preceded with '#' are omitted.
 * 
 * @return an array where each item looks like:
 *   {sample: "sample1", classes: [class11, class12...]}
 * Additionally, the array has a field "allClasses", which is a 
 * sorted array of all different classes.
 */
module.exports.read = function(pathToFile) {
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
		dataset.push({sample: sample, classes: classes});
		for (var c=0; c<classes.length; ++c)
			allClasses[classes[c]]=true;
	}
	dataset.allClasses = Object.keys(allClasses);
	dataset.allClasses.sort();
	return dataset;
}
