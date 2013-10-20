/**
 * NGramExtractor - extracts sequences of words in a text as its features.
 */

var NGramsFromArray = require('./NGramsFromArray');
module.exports = function(numOfWords, gap) {
			return function(sample, features) {
				var words = sample.split(/[ \t,;:.!?]/).filter(function(a){return !!a}); // all non-empty words
				NGramsFromArray(numOfWords, gap, words, features);
			}
};
