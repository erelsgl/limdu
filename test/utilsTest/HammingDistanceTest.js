/**
 * a unit-test for Multi-Label classification
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

var should = require('should');
var mlutils = require('../../utils');

describe('Hamming distance', function() {
	it('calculates hamming distance', function() {
		mlutils.hammingDistance([],[]).should.equal(0);
		mlutils.hammingDistance(['a'],[]).should.equal(1);
		mlutils.hammingDistance([],['a']).should.equal(1);
		mlutils.hammingDistance(['a'],['a']).should.equal(0);
		mlutils.hammingDistance(['a'],['b']).should.equal(2);
		mlutils.hammingDistance(['a','b'],['b','c']).should.equal(2);
	})
})
