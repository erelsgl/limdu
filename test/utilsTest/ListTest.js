var ulist = require('../../utils/list');
var should = require('should');
var _ = require('underscore');

describe('List test function', function() {

	it('It should correctly calculate Variance', function() {
		list = [170,300,430,470,600]	
		ulist.variance(list).should.be.equal(21704)
		
		})

	it('it should calculate average correctly', function() {
		list1= [1,2,3,4,5,6,7]
		ulist.average(list1).should.be.equal(4)
	})

	it('it should calculate median correctly', function() {
		var list1 = [3, 8, 9, 1, 5, 7, 9, 21];
		ulist.median(list1).should.be.equal(7.5)
	})

	it('it should know how to do embedding', function() {
		_.isEqual(ulist.listembed(['label']), [['label']]).should.equal(true)
		_.isEqual(ulist.listembed([]), [[]]).should.equal(true)
		_.isEqual(ulist.listembed(undefined), [[]]).should.equal(true)
		_.isEqual(ulist.listembed(null), [[]]).should.equal(true)
		_.isEqual(ulist.listembed({'classes':'label'}), ['label']).should.equal(true)
		_.isEqual(ulist.listembed({'classes':['label']}),[['label']]).should.equal(true)
	})

})