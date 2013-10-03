/**
 * a unit-test for Partitions unit (creating partitions for train and test)
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

var should = require('should');
var mlutils = require('../../utils');
var _ = require('underscore');

describe('partitions', function() {
	// A dummy dataset with 10 documents:
	var dataset = [1,2,3,4,5,6,7,8,9,10];
	it('creates 5 partitions, with a test-set of 2 in each', function() {
		var numOfPartitions = 0;
		mlutils.partitions.partitions(dataset, 5, function(train, test, index) {
			//console.log("\t"+index+": "+train+" / "+test);
			train.should.have.lengthOf(8);
			test.should.have.lengthOf(2);
			_(test).intersection(train).should.have.lengthOf(0); // most important test - make sure there is no leak from train to test!
			numOfPartitions++;
		});
		numOfPartitions.should.equal(5);
	});
	it('creates 3 partitions, with a test-set of 3 in each', function() {
		var numOfPartitions = 0;
		mlutils.partitions.partitions(dataset, 3, function(train, test, index) {
			//console.log("\t"+index+": "+train+" / "+test);	
			train.should.have.lengthOf(7);
			test.should.have.lengthOf(3);
			_(test).intersection(train).should.have.lengthOf(0); // most important test - make sure there is no leak from train to test!
			numOfPartitions++;
		});
		numOfPartitions.should.equal(3);
	});
})
