/**
 * a unit-test for winnow classifier
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

var should = require('should');
var classifiers = require('../../classifiers');

var WinnowClassifier = classifiers.Winnow.bind(this, {
	retrain_count: 10,
	do_averaging: false,
	margin: 1,
});

describe('winnow classifier', function() {
	it('supports online training', function() {
		var classifier = new WinnowClassifier();
		classifier.trainOnline({'a': 1, 'b': 0}, 0);
		classifier.classify({'a': 1, 'b': 0}).should.equal(0);
		classifier.classify({'a': 0, 'b': 0}).should.equal(0);
		classifier.classify({'a': 0, 'b': 1}).should.equal(0);
		classifier.classify({'a': 1, 'b': 1}).should.equal(0);

		classifier.trainOnline({'a': 0, 'b': 1}, 1);
		classifier.classify({'a': 1, 'b': 0}).should.equal(0);
		classifier.classify({'a': 0, 'b': 1}).should.equal(1);
	})
	
	it('supports batch and online training', function() {
		var dataset = [
		               {input: {'a': 1, 'b': 0}, output: 0}, 
		               {input: {'a': 0, 'b': 1}, output: 1}
		               ];
		//console.log("batch: ");
		var classifierBatch = new WinnowClassifier();
		classifierBatch.trainBatch(dataset);
		//console.dir(classifierBatch);
		
		//console.log("online: ");
		var classifierOnline = new WinnowClassifier();
		for (var i=0; i<=classifierBatch.retrain_count; ++i)
			for (var d=0; d<dataset.length; ++d)
				classifierOnline.trainOnline(dataset[d].input, dataset[d].output);
		//console.dir(classifierOnline);
		
		classifierOnline.should.eql(classifierBatch);
	})

	it('supports continuous output', function() {
		var classifier = new WinnowClassifier();
		classifier.trainOnline({'a': 1, 'b': 0}, 0);
		classifier.trainOnline({'a': 0, 'b': 1}, 1);
		classifier.classify({'a': 1, 'b': 0}, 0, true).should.be.below(0);
		classifier.classify({'a': 0, 'b': 1}, 0, true).should.be.above(0);
	})

	it('explains its decisions', function() {
		var classifier = new WinnowClassifier();
		classifier.trainOnline({'a': 1, 'b': 0}, 0);
		classifier.classify({'a': 0, 'b': 0}, /*explain=*/1).should.have.property('explanation').with.lengthOf(1);
		classifier.classify({'a': 0, 'b': 0}, /*explain=*/3).should.have.property('explanation').with.lengthOf(3);
	})
})
