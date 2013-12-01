/**
 * a unit-test for decision tree
 * 
 * @author Konovalov Vasily
 */

var should = require('should');
var classifiers = require('../../classifiers');

var DecisionTree = classifiers.DecisionTree.bind(this, {
});

describe('decisiontree classifier', function() {
	
	it('batch classification', function() {
		var dataset = [
		               {input: {'a': 1, 'b': 0}, output: 0}, 
		               {input: {'a': 0, 'b': 1}, output: 1},
		               {input: {'a': 1, 'b': 1}, output: 1}
		               ];

		var classifierBatch = new DecisionTree();
		classifierBatch.trainBatch(dataset);

		classifierBatch.classify({'a': 1, 'b': 0}).should.equal(0);
		classifierBatch.classify({'a': 0, 'b': 0}).should.equal(0);
	})

})
