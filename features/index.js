module.exports = {
	NGramsFromArray: require("./NGramsFromArray"),
	NGramsOfWords:  require("./NGramsOfWords"),
	NGramsOfLetters: require("./NGramsOfLetters"),

	Hypernyms: require("./HypernymExtractor"),
	CollectionOfExtractors: require("./CollectionOfExtractors"),
	FeatureLookupTable: require("./FeatureLookupTable"),
	
	LowerCaseNormalizer: require("./LowerCaseNormalizer"),
	RegexpNormalizer: require("./RegexpNormalizer"),

	RegexpSplitter: require("./RegexpSplitter"),
};

/**
 * Call the given featureExtractor on the given sample, and return the result.
 * Used for testing.
 */
module.exports.call = function(featureExtractor, sample) {
	var features = {};
	featureExtractor(sample, features);
	return features;
} 

/**
 * If the input is a featureExtractor, return it as is.
 *
 * If it is an array of featureExtractors, convert it to a CollectionOfExtractors.
 *
 */
module.exports.normalize = function(featureExtractorOrArray) {
	return (!featureExtractorOrArray? 
				featureExtractorOrArray:
			Array.isArray(featureExtractorOrArray)? 
				new module.exports.CollectionOfExtractors(featureExtractorOrArray):
				featureExtractorOrArray);	
}
