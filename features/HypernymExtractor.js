/**
 * HypernymExtractor - extracts hypernyms - words and phrases that are entailed by the given text.
 *
 * A hypernym is described by a regular expression, a feature string, and a confidence score.
 * For example: if regexp=/no (.*)/ and feature="without $1", then, 
 *   if the sample contains "no car", the extractor will add the feature "without car", with the given confidence score (usually a number from 0 to 1).
 *
 * @author Erel Segal-haLevi
 * @since 2013-07
 */

/**
 * Adds hypernym features to the given feature-vector.
 * @param hypernyms - an array of objects {regexp: /regexp/g, feature: "feature", confidence: confidence}
 * @param sample - a string.
 * @param features an initial hash of features (optional).
 * @return a hash with all the different letter n-grams contained in the given sentence.
 */
module.exports = function(hypernyms) {
	return function(sample, features) {
		hypernyms.forEach(function(hypernym) {
			var matches = null;
			if (hypernym.regexp instanceof RegExp) {
				if (!hypernym.regexp.global) {
					console.warn("hypernym regexp, "+hypernym.regexp+", is not global - skipping");
					return;
				}
			} else {
				hypernym.regexp = new RegExp(hypernym.regexp,"gi");
			}
			while ((matches = hypernym.regexp.exec(sample)) !== null) {
				var feature = matches[0].replace(hypernym.regexp, hypernym.feature);
				features[feature]=hypernym.confidence;
			}
		});
	}
}
