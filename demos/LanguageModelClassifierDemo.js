/**
 * Demonstrates LanguageModelClassifier
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

console.log("LanguageModelClassifier demo start");

var LanguageModelClassifier = require('../classifiers/multilabel/LanguageModelClassifier');

var classifier = new LanguageModelClassifier({
	smoothingFactor: 0.9,
});


console.log("LanguageModelClassifier demo end");
