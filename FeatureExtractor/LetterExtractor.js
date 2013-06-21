/**
 * LettersFromText - extracts substrings of letters of a given size.
 */

var PAD_CHAR = '#';

/**
 * @param numOfLetters - a positive integer. 
 * @param sample - a string.
 * @param features an initial hash of features (optional).
 * @return a hash with all the different letter n-grams contained in the given sentence.
 */
exports.LettersFromText = function(numOfLetters) {
	return function(sample, features) {
		for (var i=0; i<numOfLetters-1; ++i)
			sample = PAD_CHAR+sample+PAD_CHAR;
	
		if (!features) features = {};
		for (var firstLetter=0; firstLetter<sample.length-numOfLetters+1; ++firstLetter) {
			var feature = sample.substr(firstLetter, numOfLetters);
			features[feature]=1;
		}
		return features;
	}
}

