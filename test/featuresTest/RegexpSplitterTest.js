/**
 * a unit-test for Regular Expression Splitter.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-09
 */

var should = require('should');
var ftrs = require('../../features');

describe('RegexpSplitter', function() {
	it('splits sentences without delimiter', function() {
		var res = 	ftrs.RegexpSplitter("[.,;?!]|and");
		res("Hi. Who are you? I am Erel.").should.eql(["Hi","Who are you","I am Erel"]);
		res("Hi.Who are you?I am Erel.").should.eql(["Hi","Who are you","I am Erel"]);
		res("Hi.       Who are you?           I am Erel.          ").should.eql(["Hi","Who are you","I am Erel"]);
	})
	it('splits sentences with delimiter', function() {
		var res = 	ftrs.RegexpSplitter("[.,;?!]|and", {"?": true, ".": false});
		res("Hi. Who are you? I am Erel.").should.eql(["Hi","Who are you ?","I am Erel"]);
		res("Hi.Who are you?I am Erel.").should.eql(["Hi","Who are you ?","I am Erel"]);
		res("Hi.        Who are you?        I am Erel.").should.eql(["Hi","Who are you ?","I am Erel"]);
	})
})
