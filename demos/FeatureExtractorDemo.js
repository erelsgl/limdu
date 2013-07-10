/**
 * Demonstrates several ways of extracting features from samples.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */


console.log("FeatureExtractor demo start");

var FeatureExtractor = require('../features');

var string = "This is a demo, you know?";
console.log("\nOriginal sentence:")
console.dir(string);
console.log("\nword 1-grams:")
console.dir(FeatureExtractor.WordsFromText(1)(string));
console.log("\nword 2-grams:")
console.dir(FeatureExtractor.WordsFromText(2)(string));
console.log("\nhypernyms:")
var hypernyms = [
	{regexp: /demo/g, feature: "demonstration", confidence: 0.9}
];
console.dir(FeatureExtractor.Hypernyms(hypernyms)(string));
console.log("\nletter 1-grams:")
console.dir(FeatureExtractor.LettersFromText(1)(string));
console.log("\nletter 2-grams:")
console.dir(FeatureExtractor.LettersFromText(2)(string));

console.log("\nall features together:")
console.dir(FeatureExtractor.CollectionOfExtractors(
	[FeatureExtractor.WordsFromText(1), FeatureExtractor.LettersFromText(1), FeatureExtractor.LettersFromText(2), FeatureExtractor.Hypernyms(hypernyms)]) (string));

console.log("FeatureExtractor demo end");
