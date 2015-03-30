/**
 * a unit-test for PrecisionRecall unit
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

var should = require('should');
var mlutils = require('../../utils');
var _ = require('underscore');
require ('../sorted');

describe('PrecisionRecall object', function() {
	it('correctly calculates precision, recall, etc.', function() {
		var pr = new mlutils.PrecisionRecall();
		pr.addCases([1,2,3,4,5] , [1,3,5,7]);
		pr.calculateStats();
		pr.Accuracy.should.equal(0);
		pr.count.should.equal(1);
		pr.Precision.should.equal(3/4);
		pr.Recall.should.equal(3/5);
		pr.F1.should.equal(2/(4/3+5/3));
		pr.HammingLoss.should.equal(3/5);
		pr.HammingGain.should.equal(2/5);
	});

	it('correctly calculates precision, recall, accuracy in hash format.', function() {
		var pr = new mlutils.PrecisionRecall();
		var stats = pr.addCasesHash([1,2,3,4,5], [1,3,5,7], 1);
		_.isEqual(stats['TP'], ['1','3','5']).should.equal(true)
		_.isEqual(stats['FP'], ['7']).should.equal(true)
		_.isEqual(stats['FN'], ['2','4']).should.equal(true)
		
		var stats = pr.addCasesHash([1,2], [2,1], 1);
		var stats = pr.addCasesHash([1,2], [2,1,5], 1);

		var results = pr.retrieveStats()

		results['Accuracy'].should.equal(1/3)
		results['Precision'].should.equal(7/9)
		results['Recall'].should.equal(7/9)
	});

	it('correctly calculates precision, recall, accuracy in sequence format.', function() {
        var pr = new mlutils.PrecisionRecall();
		
		var expected =  
				[
                	["Offer", [13,26]],
                	["Working Hours", [6,9]],
                	["8 hours", [3,12]],
                	["10 hours", []]
				]

		var actual = 
				[
					['Offer',[13,25]],
					['Salary', [3,6]],
					['8 hours', [3,5]],
					['10 hours', [9,15]],
				]
			
        var stats = pr.addCasesHashSeq(expected, actual, 1);

        stats['TP'].sorted().should.eql(['10 hours', '8 hours', 'Offer'])
        stats['FP'].sorted().should.eql(['Salary'])
        stats['FN'].sorted().should.eql(['Working Hours'])

        var results = pr.retrieveStats()

        var stats = pr.addCasesHashSeq(expected, actual, 1);
    });

    it('intersection', function() {
        var pr = new mlutils.PrecisionRecall();
    	
    	var actual = [5,10]
    	var expected = [8,15]

    	var stats = pr.intersection(actual, expected)
    	stats.should.be.true

    	var actual = [5,10]
    	var expected = [12,15]
		
		var stats = pr.intersection(actual, expected)
    	stats.should.be.false
    })

    it('repetitions in sequence format', function() {
    	var pr = new mlutils.PrecisionRecall();
    	var expected =  [[]]
    	var actual = 
				[
					['Offer',[13,25], 'i offer'],
					['Offer', [14,27], 'ok'],
				]
		
		var stats = pr.addCasesHashSeq(expected, actual, 1);
		_.isEqual(stats, { TP: [], FP: [ 'Offer' ], FN: [] }).should.be.true
    })

	it('correctly calculates precision, recall, accuracy in hash format.', function() {
		var pr = new mlutils.PrecisionRecall();
		var stats = pr.addCasesLabels([1,2,3,4,5], [1,3,5,7], 1);
		_.isEqual(pr.labels['1'],{ TP: 1, FP: 0, FN: 0 }).should.equal(true)
		var stats = pr.addCasesLabels([1,5,9,2], [7,4], 1);
		_.isEqual(pr.labels['1'],{ TP: 1, FP: 0, FN: 1 }).should.equal(true)
		_.isEqual(pr.labels['7'],{ TP: 0, FP: 2, FN: 0 }).should.equal(true)
		_.isEqual(pr.labels['9'],{ TP: 0, FP: 0, FN: 1 }).should.equal(true)
		var stats = pr.addCasesLabels([19,4,7], [12,7,4,2,76,19,1], 1);
		_.isEqual(pr.labels['7'],{ TP: 1, FP: 2, FN: 0 }).should.equal(true)
		var labels = pr.retrieveLabels()
		labels['1']['F1'].should.equal(2*0.5*0.5/(1))
		labels['7']['F1'].should.equal((2*1/3)/(4/3))
		var stat = pr.calculateStats()
	})

	it.skip('correctly calculates dependencies between labels', function() {

		var pr = new mlutils.PrecisionRecall();
    	var expected =  [[]]
    	var actual = 
				[
					['Offer',[13,25], 'i offer'],
					['Accept', [10,27], 'offer'],
					['Reject', [30,45], 'reject'],
				]
		
		var stats = pr.addCasesHashSeq(expected, actual, 1);

		var actual = 
				[
					['Offer',[13,25], 'i offer'],
					['Offer',[14,25], 'offer'],
					['Accept', [60,70], 'agree'],
					['Reject', [90,100], 'decline']
				]

		var stats = pr.addCasesHashSeq(expected, actual, 1);
		pr.calculateStats()

		var gold = {"Offer": { "Offer": [ "i offer", "i offer" ], "Accept": [ "offer" ] },
        "Accept": { "Accept": [ "offer", "agree" ], "Offer": [ "i offer" ] },
        "Reject": { "Reject": [ "reject", "decline" ] }}

		pr.retrieveStats()['interdep'].should.eql(gold)
	})
})
