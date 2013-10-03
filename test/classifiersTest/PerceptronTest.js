/**
 * a unit-test for perceptron
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

var should = require('should');
var classifiers = require('../../classifiers');

var classifier = new classifiers.Perceptron({
	retrain_count: 1,
	do_averaging: false,
});

describe('perceptron classifier', function() {
	it('supports online training', function() {
		classifier.trainOnline({'a': 1, 'b': 0}, 0);
		classifier.classify({'a': 1, 'b': 0}).should.equal(0);
		classifier.classify({'a': 0, 'b': 0}).should.equal(0);
		classifier.classify({'a': 0, 'b': 1}).should.equal(0);
		classifier.classify({'a': 1, 'b': 1}).should.equal(0);

		classifier.trainOnline({'a': 0, 'b': 1}, 1);
		classifier.trainOnline({'a': 1, 'b': 0}, 0);
		classifier.classify({'a': 1, 'b': 0}).should.equal(0);
		classifier.classify({'a': 0, 'b': 1}).should.equal(1);
	})

	it('explains its decisions', function() {
		classifier.trainOnline({'a': 1, 'b': 0}, 0);
		classifier.classify({'a': 0, 'b': 0}, /*explain=*/1).should.have.property('explanation');
		classifier.classify({'a': 0, 'b': 0}, /*explain=*/3).should.have.property('explanation');
	})
})
