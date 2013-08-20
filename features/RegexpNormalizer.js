/**
 * RegexpNormalizer - normalizes sentences using a custom regular expression file.
 *
 * A normalization rule is described by two regular expressions: 'source' and 'target'.
 *
 * @author Erel Segal-haLevi
 * @since 2013-07
 */

/**
 * normalizes a sentence based on a list of regular expressions.
 * @param normalizations - an array of objects {source: /regexp/g, target: "target"}
 * @param sample - a string.
 * @return a new string, with all normalizations carried out.
 */
module.exports = function(normalizations) {
	return function(sample) {
		normalizations.forEach(function(normalization) {
			var matches = null;
			if (normalization.source instanceof RegExp) {
				if (!normalization.source.global) {
					console.warn("normalization source, "+normalization.source+", is not global - skipping");
					return;
				}
			} else {
				normalization.source = new RegExp(normalization.source,"gi");
			}
			sample = sample.replace(normalization.source, normalization.target);
			//console.log(sample);
		});
		return sample;
	}
}
