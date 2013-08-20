/**
 * Demonstrates several ways of extracting features from samples.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */


console.log("Features Extraction demo start");

var FeaturesUnit = require('../features');

var string = "This is a demo, you know?";
console.log("\nOriginal sentence:")
console.dir(string);
console.log("\nword 1-grams:")
console.dir(FeaturesUnit.WordsFromText(1)(string));
console.log("\nword 2-grams:")
console.dir(FeaturesUnit.WordsFromText(2)(string));
console.log("\nhypernyms:")
var hypernyms = [
	{regexp: /demo/g, feature: "demonstration", confidence: 0.9}
];
console.dir(FeaturesUnit.Hypernyms(hypernyms)(string));
console.log("\nletter 1-grams:")
console.dir(FeaturesUnit.LettersFromText(1)(string));
console.log("\nletter 2-grams:")
console.dir(FeaturesUnit.LettersFromText(2)(string));

console.log("\nall features together:")
console.dir(FeaturesUnit.CollectionOfExtractors(
	[FeaturesUnit.WordsFromText(1), 
	 FeaturesUnit.LettersFromText(1), 
	 FeaturesUnit.LettersFromText(2), 
	 FeaturesUnit.Hypernyms(hypernyms)]) (string));

console.log("Features Extraction demo end");
