/**
 * LowerCaseNormalizer - normalizes sentences by converting them to lower-case.
 *
 * @author Erel Segal-haLevi
 * @since 2013-08
 */

/**
 * normalizes a sentence based on a list of regular expressions.
 * @param normalizations - an array of objects {source: /regexp/g, target: "target"}
 * @param sample - a string.
 * @return a new string, with all normalizations carried out.
 */
module.exports = function(sample) {
	return sample.toLowerCase();
}
