/**
 * WordExtractor - extracts the words in a text as its features.
 */

/**
 * Adds letter n-gram features to the given feature-vector.
 * @param numOfLetters - a positive integer. 
 * @param sample - a string.
 * @param features an initial hash of features (optional).
 * @return a hash with all the different letter n-grams contained in the given sentence.
 */
exports.WordsFromText = function(sample, features) {
	var words = sample.split(/\W+/);
	if (!features) features = {};
	for (var i in words) {
		features[words[i]]=1;
	}
	return features;
}
