
var alphanumeric = /[a-z0-9]/i;

/**
 * LastLetterExtractor - extracts the last non-alphanumeric letter (which may indicate a question, etc.).
 */
module.exports = function(sample, features) {
	if (!sample || sample.length==0) return;
	var lastLetter = sample[sample.length-1];
	if (!alphanumeric.test(lastLetter)) {
		var feature = lastLetter+" [end]";
		features[feature]=1;
	}
}
