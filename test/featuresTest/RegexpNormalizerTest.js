/**
 * a unit-test for Regular Expression Normalizer.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

var should = require('should');
var ftrs = require('../../features');

describe('RegexpNormalizer', function() {
	it('normalizes simple strings', function() {
		var ren = 	ftrs.RegexpNormalizer([
			{source: "can't", target: "cannot"},
			{source: "cannot", target: "can not"},
			{source: "won't", target: "will not"},
		])
		ren("I can't do it and I won't do it").should.eql("I can not do it and I will not do it");
	})
	it('normalizes regular expressions', function() {
		var ren = 	ftrs.RegexpNormalizer([
			{source: "\\b(...+)est\\b", target: "$1"},
			{source: "\\b(...+)er\\b", target: "$1"},
		])
		ren("faster and highest").should.eql("fast and high");
	})
	it('normalizes numbers', function() {
		var ren = 	ftrs.RegexpNormalizer([
			{source: "\\b(\\d+)k\\b", target: "$1000"},
		])
		ren("I want 7k dollars").should.eql("I want 7000 dollars");
		ren("I want 70k dollars").should.eql("I want 70000 dollars");
	})
})
