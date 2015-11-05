/**
 * a unit-test for PrecisionRecall unit
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

var should = require('should');
var mlutils = require('../../utils');
var _ = require('underscore');

describe('PrecisionRecall object', function() {
	
	it('empty sample', function() {
		var pr = new mlutils.PrecisionRecall();
		var expl = pr.addCasesHash([], [], true)
		_.isEqual(expl, {"TP":[]})
		_.keys(pr.labels).length.should.equal(0)
	})

	it('confusion', function() {
		var pr = new mlutils.PrecisionRecall();
		var expl = pr.addCasesHash([1], [1,3], true)
		_.isEqual(pr.confusion, {"1": {"1": 1,"3": 1}}).should.be.true
	})

	it('correctly calculates precision, recall, etc.', function() {
		var pr = new mlutils.PrecisionRecall();
		var expl = pr.addCasesHash([1,2,3,4,5], [1,3,5,7], true)

		_.isEqual(expl.TP, ["1","3","5"]).should.be.true
		_.isEqual(expl.FP, ["7"]).should.be.true
		_.isEqual(expl.FN, ["2","4"]).should.be.true

		pr.labels["1"]["TP"].should.equal(1)
		pr.labels["4"]["FN"].should.equal(1)
		pr.labels["7"]["FP"].should.equal(1)
		
		var expl = pr.addCasesHash([1,3,4,5], [1,2,8],true)
		
		_.isEqual(expl.TP, ["1"]).should.be.true
		_.isEqual(expl.FP, ["2","8"]).should.be.true
		_.isEqual(expl.FN, ["3","4","5"]).should.be.true

		pr.labels["1"]["TP"].should.equal(2)
		pr.labels["8"]["FP"].should.equal(1)
		
		pr.calculateStats();

		pr.labels["1"]["F1"].should.equal(1)
		pr.labels["3"]["Recall"].should.equal(1/2)
		pr.labels["3"]["Precision"].should.equal(1)
		pr.labels["3"]["Recall"].should.equal(0.5)

		pr.Accuracy.should.equal(0);
		pr.microPrecision.should.equal(4/(4+3));
		pr.microRecall.should.equal(4/(4+5));
		pr.microF1.should.equal(2*pr.microPrecision*pr.microRecall/(pr.microPrecision+pr.microRecall));

		pr.macroRecall.should.equal((0.5 + 0 + 0.5 + 0 + 1)/7)
		pr.macroPrecision.should.equal(3/7)
		pr.macroF1.should.equal((1+2/3+2/3)/7)

		var expl = pr.addCasesHash([5,2,7,8], [2,3,7,4,8],true)

		pr.labels["2"]["TP"].should.equal(1)
		
		pr.calculateStats();

		pr.macroF1.should.equal((2/3+2/3+0.5+0.5+0.5+1)/7)
		pr.macroPrecision.should.equal((1+0.5+0.5+0+1+0.5+0.5)/7)
		pr.macroRecall.should.equal((1+0.5+0.5+0+1/3+1+1)/7)
	});

	it('correctly calculates precision, recall, accuracy in hash format.', function() {
		var pr = new mlutils.PrecisionRecall();
		var stats = pr.addCasesHash([1,2,3,4,5], [1,3,5,7], 1);
		_.isEqual(stats['TP'], ['1','3','5']).should.equal(true)
		_.isEqual(stats['FP'], ['7']).should.equal(true)
		_.isEqual(stats['FN'], ['2','4']).should.equal(true)
		
		var stats = pr.addCasesHash([1,2], [2,1], 1);
		var stats = pr.addCasesHash([1,2], [2,1,5], 1);

		pr.calculateStats()

		pr.Accuracy.should.equal(1/3)
		pr.microPrecision.should.equal(7/9)
		pr.microRecall.should.equal(7/9)
	})

	it('scikit example', function() {
		var pr = new mlutils.PrecisionRecall();
		pr.addCasesHash([0], [0], 1);
		pr.addCasesHash([1], [2], 1);
		pr.addCasesHash([2], [1], 1);
		pr.addCasesHash([0], [0], 1);
		pr.addCasesHash([1], [0], 1);
		pr.addCasesHash([2], [1], 1);

		pr.calculateStats()

		pr.macroF1.should.equal(0.8/3)
		pr.microF1.should.equal(1/3)

		pr.addCasesHash([2], [2], 1);

		pr.calculateStats()

		pr.macroF1.should.equal((0.8+0.4)/3)
		pr.microF1.should.equal(0.42857142857142855)

		pr.addCasesHash([1], [1], 1);

		pr.calculateStats()

		// pr.macroF1.should.be.closeTo((0.8+0.4+1/3)/3, 0.0001)
	})



	// it.skip('uniqueaggregate', function() {
	// 	var pr = new mlutils.PrecisionRecall();
	// 	var ac = [['Greet',[1,5]], ['Offer',[0,5]], ['Greet',[0,6]], ['Offer',[9,15]], ['Greet',[0,9]]]
	// 	var output = pr.uniqueaggregate(ac)
	// 	output.length.should.equal(3)

	// 	var actual = pr.uniquecandidate(output)
	// 	_.isEqual(actual[0], ['Greet',[0,9]]).should.be.true
	// })	

	// it.skip('correctly calculates precision, recall, accuracy in sequence format.', function() {
 //        var pr = new mlutils.PrecisionRecall();
		
	// 	var expected =  
	// 			[
 //                	["Offer", [13,26]],
 //                	["Working Hours", [6,9]],
 //                	["8 hours", [3,12]],
 //                	["10 hours", []]
	// 			]

	// 	var actual = 
	// 			[
	// 				['Offer',[13,25]],
	// 				['Salary', [3,6]],
	// 				['8 hours', [3,5]],
	// 				['10 hours', [9,15]],
	// 			]
			
 //        var stats = pr.addCasesHashSeq(expected, actual, 1);

 //        _.isEqual(stats['TP'], ['10 hours', '8 hours', 'Offer']).should.equal(true)
 //        _.isEqual(stats['FP'], ['Salary']).should.equal(true)
 //        _.isEqual(stats['FN'], ['Working Hours']).should.equal(true)

 //        var results = pr.retrieveStats()

 //        var stats = pr.addCasesHashSeq(expected, actual, 1);
 //    });

  //   it.skip('intersection', function() {
  //       var pr = new mlutils.PrecisionRecall();
    	
  //   	var actual = [5,10]
  //   	var expected = [8,15]

  //   	var stats = pr.intersection(actual, expected)
  //   	stats.should.be.true

  //   	var actual = [5,10]
  //   	var expected = [12,15]
		
		// var stats = pr.intersection(actual, expected)
  //   	stats.should.be.false
  //   })

  //   it.skip('repetitions in sequence format', function() {
  //   	var pr = new mlutils.PrecisionRecall();
  //   	var expected =  [[]]
  //   	var actual = 
		// 		[
		// 			['Offer',[13,25], 'i offer'],
		// 			['Offer', [14,27], 'ok'],
		// 		]
		
		// var stats = pr.addCasesHashSeq(expected, actual, 1);
		// _.isEqual(stats, { TP: [], FP: [ 'Offer' ], FN: [] }).should.be.true
  //   })

	it('correctly calculates precision, recall, accuracy in hash format.', function() {
		var pr = new mlutils.PrecisionRecall();
		var stats = pr.addCasesHash([1,2,3,4,5], [1,3,5,7], 1);
		_.isEqual(pr.labels['1'],{ TP: 1, FP: 0, FN: 0 }).should.equal(true)
		var stats = pr.addCasesHash([1,5,9,2], [7,4], 1);
		_.isEqual(pr.labels['1'],{ TP: 1, FP: 0, FN: 1 }).should.equal(true)
		_.isEqual(pr.labels['7'],{ TP: 0, FP: 2, FN: 0 }).should.equal(true)
		_.isEqual(pr.labels['9'],{ TP: 0, FP: 0, FN: 1 }).should.equal(true)
		var stats = pr.addCasesHash([19,4,7], [12,7,4,2,76,19,1], 1);
		_.isEqual(pr.labels['7'],{ TP: 1, FP: 2, FN: 0 }).should.equal(true)
		pr.calculateStats()
		pr.labels['1']['F1'].should.equal(2*0.5*0.5/(1))
		pr.labels['7']['F1'].should.equal((2*1/3)/(4/3))
	})

	// it.skip('correctly calculates dependencies between labels', function() {

	// 	var pr = new mlutils.PrecisionRecall();
 //    	var expected =  [[]]
 //    	var actual = 
	// 			[
	// 				['Offer',[13,25], 'i offer'],
	// 				['Accept', [10,27], 'offer'],
	// 				['Reject', [30,45], 'reject'],
	// 			]
		
	// 	var stats = pr.addCasesHashSeq(expected, actual, 1);

	// 	var actual = 
	// 			[
	// 				['Offer',[13,25], 'i offer'],
	// 				['Offer',[14,25], 'offer'],
	// 				['Accept', [60,70], 'agree'],
	// 				['Reject', [90,100], 'decline']
	// 			]

	// 	var stats = pr.addCasesHashSeq(expected, actual, 1);
	// 	pr.calculateStats()

	// 	var gold = {"Offer": { "Offer": [ "i offer", "i offer" ], "Accept": [ "offer" ] },
 //        "Accept": { "Accept": [ "offer", "agree" ], "Offer": [ "i offer" ] },
 //        "Reject": { "Reject": [ "reject", "decline" ] }}

	// 	_.isEqual(pr.retrieveStats()['interdep'], gold).should.be.true
	// })
})

