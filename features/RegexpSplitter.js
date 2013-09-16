/**
 * RegexpSplitter - splits sentences using a custom regular expression.
 *
 * @author Erel Segal-haLevi
 * @since 2013-08
 */

/**
 * splits sentences using a custom regular expression.
 * @param regexpString - a string
 * @param delimitersToInclude - a hash (set) of delimiters that will be added to the end of the previous sentence.
 * @param text - a string.
 * @return an array of parts (sentences). 
 */
module.exports = function(regexpString, delimitersToInclude) {
	regexpString = "("+regexpString+")";  // to capture the delimiters
	var regexp = new RegExp(regexpString, "i");
	if (!delimitersToInclude) delimitersToInclude = {};
	return function(text) {
		var parts = text.split(regexp);
		var normalizedParts = [];
		for (var i=0; i<parts.length; i+=2) {
			parts[i] = parts[i].trim();
			var part = parts[i];
			if (i+1<parts.length) {
				var delimiter = parts[i+1];
				if (delimitersToInclude[delimiter])
					part += " " + delimiter;
			}
			if (part.length>0)
				normalizedParts.push(part);
		}
		//console.log(text);
		//console.dir(normalizedParts);
		return normalizedParts;
	}
}
