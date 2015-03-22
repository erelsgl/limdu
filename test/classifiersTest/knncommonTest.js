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

	it('euclidean distance', function(){
		knncommon.euclidean_distance([0,0],[1,1]).should.equal(Math.sqrt(2))
		knncommon.euclidean_distance([0,0,1,0,0,1,0,1,1],[0,0,0,0,1,1,0,1,1]).should.equal(1.4142135623730951)
	})

	it('and_distance', function(){
		knncommon.and_distance([2,2,0,0,0],[1,1,0,1,0]).should.equal(0.5)	
		knncommon.and_distance([1,0,1,4.5,0],[0,1,0,1.5,0]).should.equal(1)	
		knncommon.and_distance([0,0,1,0,0,1,0,1,1],[0,0,0,0,1,1,0,1,1]).should.equal(0.3333333333333333)
	})

	it('cosine_distance', function(){
		knncommon.cosine_distance([2, 1, 0, 2, 0, 1, 1, 1],[2, 1, 1, 1, 1, 0, 1, 1]).should.equal(0.8215838362577491)	
		knncommon.cosine_distance([0,0,1,0,0,1,0,1,1],[0,0,0,0,1,1,0,1,1]).should.equal(0.75)
		knncommon.cosine_distance([1,1,0],[1,0,1]).should.equal(0.4999999999999999)
	})
})

