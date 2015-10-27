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

	it('partitions_consistent_by_fold', function() {

		var dataset = [1,3,5,7,9,11,13]
		var data = mlutils.partitions.partitions_consistent_by_fold(dataset, 2, 1) 
		_.isEqual(data, { train: [ 1, 3, 5, 13 ], test: [ 7, 9, 11 ] }).should.be.true
	})


	it.skip('partitions_hash_fold', function() {
		var dataset = {'label1':[1,3,5,7,9,11,13], 'label2':[0,2,4,6,8,10,12]}
		var data = mlutils.partitions.partitions_hash_fold(dataset, 2, 1) 
		_.isEqual(data["test"], [7,9,11,6,8,10]).should.be.true		
		var data = mlutils.partitions.partitions_hash_fold(dataset, 3, 2) 
		_.isEqual(data["test"], [9,11,8,10]).should.be.true
	})

	it('partition hash', function() {
		var dataset = {'label1':[1,3,5,7,9,11,13], 'label2':[0,2,4,6,8,10,12]}
		mlutils.partitions.partitions_hash(dataset, 2, function(train, test, index) {
			test.should.have.lengthOf(6);
			train.should.have.lengthOf(4);
		})
	})
	
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
