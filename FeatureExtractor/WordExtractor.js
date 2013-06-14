/**
 * WordExtractor - extracts the words in a text as its features.
 */

var _ = require("underscore")._;
var associative = require("../associative");

exports.WordsFromText = function(sample) {
	var words = sample.split(/\W+/);
	return associative.fromArray(words);
}
