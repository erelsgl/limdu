/*
 * a unit-test for kNN classifier.
 * 
 * @author Vasily Konovalov
 * @since 2015-03
 */

var should = require('should');
var knncommon = require('../../classifiers/kNN/knncommon');
var _ = require("underscore")._;

describe('kNN common test', function() {

	it('euclidean distance', function(){
		knncommon.euclidean_distance([0,0],[1,1]).should.equal(Math.sqrt(2))
	})

	it('dot distance', function(){
		knncommon.dot_distance([2,2],[1,1]).should.equal(4)
	})

	it('and distance', function(){
		knncommon.and_distance([1,0,1],[1,0,0]).should.equal(1)
		knncommon.and_distance([1,0,1],[1,0,1]).should.equal(0.5)
	})

	it('manhattan distance', function(){
		knncommon.manhattan_distance([2,2],[1,1]).should.equal(2)
	})

	it('chebyshev distance', function(){
		knncommon.chebyshev_distance([2,2],[1,1]).should.equal(1)
	})

	it('and_distance', function(){
		knncommon.and_distance([2,2,0,0,0],[1,1,0,1,0]).should.equal(0.5)	
		knncommon.and_distance([1,0,1,4.5,0],[0,1,0,1.5,0]).should.equal(1)	
	})
})

