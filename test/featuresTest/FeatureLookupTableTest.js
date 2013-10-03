/**
 * a unit-test for feature lookup tables
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

var should = require('should');
var FeatureLookupTable = require('../../features/FeatureLookupTable');

var sample1 = {a: 111, b: 222, c: 333};
var sample2 = {a: 1111, d: 4444, e: 5555};
var sample3 = {c: 33333, e: 55555, g: 77777};

describe('feature lookup table', function() {
	it('adds samples incrementally', function() {
		var table = new FeatureLookupTable();
		var array1 = table.hashToArray(sample1);
		var array2 = table.hashToArray(sample2);
		var array3 = table.hashToArray(sample3);
		array1.should.be.an.instanceOf(Array);
		array2.should.be.an.instanceOf(Array);
		array3.should.be.an.instanceOf(Array);
		table.arrayToHash(array1).should.eql(sample1);
		table.arrayToHash(array2).should.eql(sample2);
		table.arrayToHash(array3).should.eql(sample3);
	})
	
	it('adds all samples together', function() {
		var table = new FeatureLookupTable();
		var arrays = table.hashesToArrays([sample1, sample2, sample3]);
		arrays.should.be.an.instanceOf(Array).and.have.lengthOf(3);
		table.arraysToHashes(arrays).should.eql([sample1, sample2, sample3]);
	})
})
