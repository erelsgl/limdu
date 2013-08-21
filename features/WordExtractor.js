/**
 * WordExtractor - extracts the words in a text as its features.
 */

/**
 * Adds word n-gram features to the given feature-vector.
 * @param numOfWords - a positive integer. 
 * @param caseSensitive - boolean. if false, convert all to lower case.
 * @param sample - a string.
 * @param features an initial hash of features (optional).
 * @return a hash with all the different letter n-grams contained in the given sentence.
 */
module.exports = function(numOfWords, caseSensitive) {
	return function(sample, features) {
		if (!caseSensitive) sample=sample.toLowerCase();
		
		var words = sample.split(/[ \t,;.]/).filter(function(a){return !!a}); // all non-empty words

		for (var i=0; i<numOfWords-1; ++i) {
			words.push("<end>");
			words.unshift("<start>");
		}

		if (!features) features = {};
		for (var i=0; i<=words.length-numOfWords; ++i) {
			var feature = words.slice(i, i+numOfWords).join(" ");
			features[feature]=1;
		}
		return features;
	}
}
