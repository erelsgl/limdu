/**
 * LowerCaseNormalizer - normalizes sentences by converting them to lower-case.
 *
 * @author Erel Segal-haLevi
 * @since 2013-08
 */

/**
 * Normalizes a sentence by converting it to lower case.
 */
module.exports = function(sample) {
	return sample.toLowerCase();
}
