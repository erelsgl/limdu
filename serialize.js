/**
 * Static Utilities for serializing classifiers (or other objects).
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

var fs = require('fs');

exports.saveSync = function(object, filename) {
	var data = JSON.stringify(object, null, "\t");
	fs.writeFileSync(filename, data, 'utf8');	
}

exports.loadSync = function(filename) {
	var data = fs.readFileSync(filename);
	return JSON.parse(data);
}
