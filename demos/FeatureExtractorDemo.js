/**
 * Demonstrates several ways of extracting features from samples.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */


console.log("FeatureExtractor demo start");

var WordsFromText = require('../FeatureExtractor/WordExtractor').WordsFromText;
var LettersFromText = require('../FeatureExtractor/LetterExtractor').LettersFromText;
var CollectionOfExtractors = require('../FeatureExtractor/CollectionOfExtractors').CollectionOfExtractors;

var string = "This is a demo, you know?";
console.log("\nOriginal sentence:")
console.dir(string);
console.log("\nword 1-grams:")
console.dir(WordsFromText(string));
console.log("\nletter 1-grams:")
console.dir(LettersFromText(1)(string));
console.log("\nletter 2-grams:")
console.dir(LettersFromText(2)(string));

console.log("\nall features together:")
console.dir(CollectionOfExtractors([WordsFromText, LettersFromText(1), LettersFromText(2)]) (string));

console.log("FeatureExtractor demo end");
