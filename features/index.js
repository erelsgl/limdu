module.exports = {
	NGramsFromArray: require("./NGramsOfWords").NGramsFromArray,
	NGramsFromText:  require("./NGramsOfWords").NGramsFromText,
	WordsFromText :  require("./NGramsOfWords").NGramsFromText,   // for backward compatibility
	LettersFromText: require("./NGramsOfLetters"),
	
	LastLetterExtractor: require("./LastLetterExtractor"),

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
