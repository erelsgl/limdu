/**
 * WordExtractor - extracts the words in a text as its features.
 */

var _ = require("underscore")._;

exports.WordsFromText = function(sample) {
	var words = sample.split(/\W+/);
	features = {};
	for (var i in words) {
		features[words[i]]=1;
	}
	return features;
}
