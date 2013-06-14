/**
 * Demonstrates several ways of extracting features from samples.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */


console.log("FeatureExtractor demo start");

var WordsFromText = require('../FeatureExtractor/WordExtractor').WordsFromText;

console.dir(WordsFromText("This is a demo, you know?"));

console.log("FeatureExtractor demo end");
