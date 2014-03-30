/**
 * a unit-test for Bars unit
 * 
 * @since 2013-08
 */

var should = require('should');
var mlutils = require('../../utils');
var _ = require('underscore');

describe('Bars utilities', function() {
	
	it('correctly aggregate nested hashes', function() {
		stats = [{
			'F1' : 1,
			'Precision': 5,
			'Recall' : 0.75
		},
		{
			'F1' : 0.8,
			'Precision': 2,
			'Recall' : 0.4
		}]
	results = mlutils.bars.aggregate_results(stats)
	results['F1'].should.equal(0.9);
	results['Precision'].should.equal(3.5);
	results['Recall'].should.equal(0.575);
	})

	it('correctly aggregate nested hashes', function() {
		stats = [{
			'label1':
			{
				'param1' : 5,
				'param2' : 3,
			},
			'label2':
			{
				'param2' : 3,
			},
			'label3':
			{
				'param3' : 5,
				'param1' : 3,
			}
		},
		{
			'label1':
			{
				'param1' : 5,
				'param3' : 3,
			},
			'label2':
			{
				'param1' : 5,
				'param2' : 3,
			},
			'label3':
			{
				'param2' : 3,
			},
			'label4':
			{
				'param2' : 3,
				'param4' : 7,
			}
		}]
		result = mlutils.bars.aggregate_two_nested(stats)
		
		result['label1']['param1'].should.equal(5);
		result['label1']['param2'].should.equal(1.5);
		result['label1']['param3'].should.equal(1.5);

		result['label2']['param2'].should.equal(3);
		result['label2']['param1'].should.equal(2.5);

		result['label3']['param1'].should.equal(1.5);
		result['label3']['param2'].should.equal(1.5);
		result['label3']['param3'].should.equal(2.5);

		result['label4']['param2'].should.equal(1.5);
		result['label4']['param4'].should.equal(3.5);
	});

	it('correctly computes comfusion matrix', function() {
	stats = {'data':[
		{
			'explanation':{
				'TP':['Offer'],
				'FP':['Insist'],
			}
		},

		{
			'explanation':{
				'TP':['Accept'],
				'FN':['Reject']
			}
		},

		{
			'explanation':{
				'TP':['Offer', 'Insist'],
				'FP':['Accept'],
				'FN':['Query']
			}
		},

	]}

	matrix = mlutils.bars.confusion_matrix(stats)

	matrix['Offer']['Offer'].should.equal(2)
	matrix['Offer']['Insist'].should.equal(1)
	matrix['Offer']['Accept'].should.equal(1)
	matrix['Accept']['Accept'].should.equal(1)
	matrix['Reject']['nolabel'].should.equal(1)
	matrix['Insist']['Insist'].should.equal(1)
	matrix['Insist']['Accept'].should.equal(1)
	matrix['Query']['Accept'].should.equal(1)
	matrix['Query']['nolabel'].should.equal(1)

	})

})
