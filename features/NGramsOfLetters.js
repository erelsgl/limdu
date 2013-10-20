/**
 * Extracts substrings of letters of a given size.
 */

var PAD_CHAR = '#';

/**
 * Add letter n-gram features to the given feature-vector.
 *
 * @param numOfLetters - a positive integer.
 * @param caseSensitive - boolean. if false, convert all to lower case.
 * @param sample - a string.
 * @param features an initial hash of features (optional).
 * @return a hash with all the different letter n-grams contained in the given sentence.
 */
module.exports = function(numOfLetters, caseSensitive) {
	return function(sample, features) {
		if (!caseSensitive) sample=sample.toLowerCase();
		for (var i=0; i<numOfLetters-1; ++i)
			sample = PAD_CHAR+sample+PAD_CHAR;
		for (var firstLetter=0; firstLetter<sample.length-numOfLetters+1; ++firstLetter) {
			var feature = sample.substr(firstLetter, numOfLetters);
			features[feature]=1;
		}
	}
}

