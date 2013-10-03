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
	var pr = new mlutils.PrecisionRecall();
	it('correctly calculates precision, recall, etc.', function() {
		var expectedClasses = [1,2,3,4,5];
		var actualClasses   = [1,3,5,7];
		pr.addCases(expectedClasses, actualClasses);
		
		pr.calculateStats();
		pr.Accuracy.should.equal(0);
		pr.count.should.equal(1);
		pr.Precision.should.equal(3/4);
		pr.Recall.should.equal(3/5);
		pr.F1.should.equal(2/(4/3+5/3));
		pr.HammingLoss.should.equal(3/5);
		pr.HammingGain.should.equal(2/5);
	});
})
