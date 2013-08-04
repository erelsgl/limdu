/**
 * a unit-test for the class BinaryClassifierSet - combining several binary classifiers to produce a multi-class classifier.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-07
 */

var util = require('util');

var createNewClassifier = function() {
	var classifiers = require('../classifiers');
	return new classifiers.BinaryClassifierSet({
		binaryClassifierType: classifiers.Bayesian
	});
}

describe('Binary Classifier Set', function() {
})
