/**
 * WordTyposExtractor - extracts words some letters removed, for detecting spelling mistakes
 */

/**
 * @return array of all the versions of the given word, where one letter is removed:
 */
function allVersionsWithOneLetterRemoved(word) {
	var versions = [];
	for (var iLetter=0; iLetter<word.length; ++iLetter) {
		versions.push(word.slice(0, iLetter) + word.slice(iLetter+1, word.length));
	}
	return versions;
}

/**
 * Adds word n-gram features to the given feature-vector, with each letter reomved once.
 * @param numOfWords - a positive integer. 
 * @param caseSensitive - boolean. if false, convert all to lower case.
 * @param minLetters - int. minimum number of letters for using this extractor. If number of letters in sample is less than this number, then no removals will take place.
 * @param confidence - float, between 0 and 1. Confidence of altered versions.
 * @param sample - a string.
 * @param features an initial hash of features (optional).
 * @return a hash with all the different letter n-grams contained in the given sentence.
 */
module.exports = function(numOfWords, caseSensitive, minLetters, confidence) {
	return function(sample, features) {
		if (!caseSensitive) sample=sample.toLowerCase();
		
		var words = sample.split(/\W+/).filter(function(a){return !!a}); // all non-empty words

		if (!features) features = {};
		for (var i=0; i<=words.length-numOfWords; ++i) {
			var feature = words.slice(i, i+numOfWords).join(" ");
			features[feature]=1;
			if (feature.length >= minLetters) {
				var allFeatures = allVersionsWithOneLetterRemoved(feature);
				for (var j=0; j<allFeatures.length; ++j) {
					features[allFeatures[j]]=confidence;
				}
			}
		}
		return features;
	}
}
