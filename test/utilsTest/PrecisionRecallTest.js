#!mocha

/**
 * a unit-test for PrecisionRecall unit
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

var should = require('should');
var mlutils = require('../../utils');
var _ = require('underscore');

describe('PrecisionRecall object', function() {
	
	it('empty sample', function() {
		var pr = new mlutils.PrecisionRecall();
		var expl = pr.addCasesHash([], [], true)
		_.isEqual(expl, {"TP":[]})
		_.keys(pr.labels).length.should.equal(0)
	})

	it('confusion', function() {
		var pr = new mlutils.PrecisionRecall();
		var expl = pr.addCasesHash([1], [1,3], true)
		_.isEqual(pr.confusion, {"1": {"1": 1,"3": 1}}).should.be.true
	})

	it('correctly calculates precision, recall, etc.', function() {
		var pr = new mlutils.PrecisionRecall();
		var expl = pr.addCases(/*expectedClasses=*/[1,2,3,4,5], /*actualClasses=*/[1,3,5,7], /*log true positives=*/true)

		_.isEqual(pr.TP, 3).should.be.true  // ["1","3","5"]
		_.isEqual(pr.FP, 1).should.be.true  // ["7"]
		_.isEqual(pr.FN, 2).should.be.true  // ["2","4"]
		
		var expl = pr.addCases([1,3,4,5], [1,2,8],true)

		_.isEqual(pr.TP, 1).should.be.true  // ["1"]
		_.isEqual(pr.FP, 2).should.be.true  // ["2","8"]
		_.isEqual(pr.FN, 3).should.be.true  // ["3","4","5"]

		pr.calculateStats();

		pr.Accuracy.should.equal(0);
		pr.Precision.should.equal(4/(4+3));  // microPrecision
		pr.Recall.should.equal(4/(4+5));     // microRecall
		pr.F1.should.equal(2*pr.Precision*pr.Recall/(pr.Precision+pr.Recall));

		// pr.macroRecall.should.equal((0.5 + 0 + 0.5 + 0 + 1)/7.0)
		// pr.macroPrecision.should.equal(3/7)
		// pr.macroF1.should.equal((1+2/3+2/3)/7)

		var expl = pr.addCasesHash([5,2,7,8], [2,3,7,4,8],true)

		pr.calculateStats();

		// pr.macroF1.should.equal((2/3+2/3+0.5+0.5+0.5+1)/7)
		// pr.macroPrecision.should.equal((1+0.5+0.5+0+1+0.5+0.5)/7)
		// pr.macroRecall.should.equal((1+0.5+0.5+0+1/3+1+1)/7)
	});

	it('correctly calculates precision, recall, accuracy in hash format.', function() {
		var pr = new mlutils.PrecisionRecall();
		var stats = pr.addCasesHash([1,2,3,4,5], [1,3,5,7], 1);
		_.isEqual(stats['TP'], ['1','3','5']).should.equal(true)
		_.isEqual(stats['FP'], ['7']).should.equal(true)
		_.isEqual(stats['FN'], ['2','4']).should.equal(true)
		
		var stats = pr.addCasesHash([1,2], [2,1], 1);
		var stats = pr.addCasesHash([1,2], [2,1,5], 1);

		pr.calculateStats()

		pr.Accuracy.should.equal(1/3)
		pr.Precision.should.equal(7/9)
		pr.Recall.should.equal(7/9)
	})

	it('scikit example', function() {
		var pr = new mlutils.PrecisionRecall();
		pr.addCasesHash([0], [0], 1);
		pr.addCasesHash([1], [2], 1);
		pr.addCasesHash([2], [1], 1);
		pr.addCasesHash([0], [0], 1);
		pr.addCasesHash([1], [0], 1);
		pr.addCasesHash([2], [1], 1);

		pr.calculateStats()

		// pr.macroF1.should.equal(0.8/3)
		pr.F1.should.equal(1/3)

		pr.addCasesHash([2], [2], 1);

		pr.calculateStats()

		// pr.macroF1.should.equal((0.8+0.4)/3)
		pr.F1.should.equal(0.42857142857142855)

		pr.addCasesHash([1], [1], 1);

		pr.calculateStats()

		// pr.macroF1.should.be.closeTo((0.8+0.4+1/3)/3, 0.0001)
	})



	it('correctly calculates precision, recall, accuracy in hash format.', function() {
		var pr = new mlutils.PrecisionRecall();
		var stats = pr.addCasesHash([1,2,3,4,5], [1,3,5,7], 1);
		// _.isEqual(pr.labels['1'],{ TP: 1, FP: 0, FN: 0 }).should.equal(true)
		var stats = pr.addCasesHash([1,5,9,2], [7,4], 1);
		// _.isEqual(pr.labels['1'],{ TP: 1, FP: 0, FN: 1 }).should.equal(true)
		// _.isEqual(pr.labels['7'],{ TP: 0, FP: 2, FN: 0 }).should.equal(true)
		// _.isEqual(pr.labels['9'],{ TP: 0, FP: 0, FN: 1 }).should.equal(true)
		var stats = pr.addCasesHash([19,4,7], [12,7,4,2,76,19,1], 1);
		// _.isEqual(pr.labels['7'],{ TP: 1, FP: 2, FN: 0 }).should.equal(true)
		pr.calculateStats()
	})

})

