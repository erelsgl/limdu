/**
 * NGramExtractor - extracts sequences of words in a text as its features.
 */

module.exports = {

		/**
		 * Adds word n-gram features to the given feature-vector.
		 * @param numOfWords - the n from the n-gram (length of sequence).
		 * @param gap - if true, convert the middle word to a "-" (relevant for numOfWords=3).  
		 * @param grams - array of individual grams.
		 * @param features an initial hash of features (optional).
		 * @return a hash with all the different n-grams.
		 */
		NGramsFromArray: function(numOfWords, gap, grams, features) {
				for (var i=0; i<numOfWords-1-(gap?1:0); ++i) {
					grams.unshift("[start]");
					grams.push("[end]");
				}
				for (var i=0; i<=grams.length-numOfWords; ++i) {
					sliceOfWords = grams.slice(i, i+numOfWords);
					if (gap) sliceOfWords[1]="-";
					var feature = sliceOfWords.join(" ");
					features[feature]=1;
				}
				for (var i=0; i<numOfWords-1-(gap?1:0); ++i) {
					grams.pop();
					grams.shift();
				}
		},

		/**
		 * Adds word n-gram features to the given feature-vector.
		 * @param numOfWords - a positive integer.
		 * @param gap - if true, convert the middle word to a "-".  
		 * @param sample - a string.
		 * @param features an initial hash of features (optional).
		 * @return a hash with all the different letter n-grams contained in the given sentence.
		 */
		NGramsFromText: function(numOfWords, gap) {
			return function(sample, features) {
				var words = sample.split(/[ \t,;:.!?]/).filter(function(a){return !!a}); // all non-empty words
				module.exports.NGramsFromArray(numOfWords, gap, words, features);
			}
		},
}
