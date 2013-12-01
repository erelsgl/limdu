/**
 * a unit-test for decision tree
 * 
 * @author Konovalov Vasily
 */

var should = require('should');
var classifiers = require('../../classifiers');

var DecisionTree = classifiers.DecisionTree.bind(this, {
});

var dataset = [
		               {input: {'a': 1, 'b': 0}, output: 0}, 
		               {input: {'a': 0, 'b': 1}, output: 1},
		               {input: {'a': 1, 'b': 1}, output: 1}
		               ];

var classifierBatch = new DecisionTree();
classifierBatch.trainBatch(dataset);

describe('decisiontree classifier', function() {
	
	it('batch classification', function() {
		classifierBatch.classify({'a': 1, 'b': 0}).should.equal(0);
		classifierBatch.classify({'a': 0, 'b': 0}).should.equal(0);
	}),

	it('it performs toJSON and fromJSON correctly', function() {
		var json = classifierBatch.toJSON()
		var classifier = new DecisionTree();
		classifier.fromJSON(json)
		classifier.classify({'a': 1, 'b': 0}).should.equal(0);
		classifier.classify({'a': 0, 'b': 0}).should.equal(0);
	})
})
