/**
 * RegexpSplitter - splits sentences using a custom regular expression.
 *
 * @author Erel Segal-haLevi
 * @since 2013-08
 */

/**
 * splits sentences using a custom regular expression.
 * @param regexp
 * @param text - a string.
 * @return an array of sentences. 
 */
module.exports = function(regexp) {
	if (!(regexp instanceof RegExp))
		regexp = new RegExp(regexp, "i");
	return function(text) {
		return text.split(regexp); 
	}
}
