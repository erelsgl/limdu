/**
 * WordExtractor - extracts the words in a text as its features.
 */

/**
 * Adds word n-gram features to the given feature-vector.
 * @param numOfWords - a positive integer.
 * @param gap - if true, convert the middle word to a "-".  
 * @param sample - a string.
 * @param features an initial hash of features (optional).
 * @return a hash with all the different letter n-grams contained in the given sentence.
 */
module.exports = function(numOfWords, gap) {
	return function(sample, features) {
		var words = sample.split(/[ \t,;:.!?]/).filter(function(a){return !!a}); // all non-empty words

		for (var i=0; i<numOfWords-1-(gap?1:0); ++i) {
			words.unshift("[start]");
			words.push("[end]");
		}

		if (!features) features = {};
		for (var i=0; i<=words.length-numOfWords; ++i) {
			sliceOfWords = words.slice(i, i+numOfWords);
			if (gap) sliceOfWords[1]="-";
			var feature = sliceOfWords.join(" ");
			features[feature]=1;
		}
		return features;
	}
}
