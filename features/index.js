module.exports = {
	WordsFromText: require("./WordExtractor"),
	//WordsTyposFromText: require("./WordTyposExtractor"),
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
