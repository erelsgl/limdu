module.exports = {
	NGramsFromArray: require("./NGramExtractor").NGramsFromArray,
	NGramsFromText:  require("./NGramExtractor").NGramsFromText,
	WordsFromText :  require("./NGramExtractor").NGramsFromText,   // for backward compatibility

	LettersFromText: require("./LetterExtractor"),
	Hypernyms: require("./HypernymExtractor"),
	CollectionOfExtractors: require("./CollectionOfExtractors"),
	FeatureLookupTable: require("./FeatureLookupTable"),
	RegexpNormalizer: require("./RegexpNormalizer"),
	LowerCaseNormalizer: require("./LowerCaseNormalizer"),
	RegexpSplitter: require("./RegexpSplitter"),
	LastLetterExtractor: require("./LastLetterExtractor"),
}

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
