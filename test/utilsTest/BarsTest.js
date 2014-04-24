/**
 * a unit-test for Bars unit
 * 
 * @since 2013-08
 */

var should = require('should');
var mlutils = require('../../utils');
var _ = require('underscore');
var classifiers = require('../../classifiers');
var ftrs = require('../../features');


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

	it('correctly computes ambiguity between labels', function() {
		amb	= mlutils.bars.intent_attr_label_ambiguity([['Offer', 'Reject', 'Greet'],['Salary', 'Working Hours'],['20,000']])
		amb.length.should.equal(2)
		amb[0]['attr'].should.equal('Salary')
		amb[1]['attr'].should.equal('Working Hours')
		_.isEqual(amb[0]['list'], ['Offer','Reject']).should.equal(true)
		_.isEqual(amb[1]['list'], ['Offer','Reject']).should.equal(true)
	})

	it('correctly computes ambiguity in dataset', function() {
		dataset = [{
					'input': "",
					'output': [ '{"Insist":"Working Hours"}','{"Offer":{"Job Description":"Programmer"}}','{"Offer":{"Working Hours":"10 hours"}}' ]
				}]

		amba = mlutils.bars.intent_attr_dataset_ambiguity(dataset)
		amba[0]['ambiguity'].length.should.equal(2)
		amba[0]['ambiguity'][0]['attr'].should.equal("Working Hours")
		amba[0]['ambiguity'][1]['attr'].should.equal("Job Description")

		dataset = [{
					'input': "",
					'output': [ '{"Insist":"Working Hours"}','{"Greet":true}' ]
				}]

		amba = mlutils.bars.intent_attr_dataset_ambiguity(dataset)
		amba.length.should.equal(0)
		
	})	

	it('correctly compuets explanation', function() {
		explanation = ["how about 10000 nis",
    {
    	"positive": {
    			"Offer": [["label1",3], ["label7",2], ["label3",3]],
            	"Salary": [["label1",1], ["label2",5]]
            	},
     	"negative": {
            	"Greet": [["label1",1], ["label2",2]],
            	"Aceept": [["label1",1], ["label3",2]],
        		}
    },
    	"blaasdasdada",
	{
    	"positive": {
    			"Offer": [["label1",1], ["label2",2], ["label3",3]],
            	"Salary": [["label1",1], ["label4",5]]
            	},
     	"negative": {
            	"Greet": [["label1",1], ["label4",2]],
            	"Aceept": [["label1",1], ["label3",2]],
        		}
    }]

    original = {
    "positive": {
        "Offer": [["label1",4],["label7",2],["label3",6],["label2",2]],
        "Salary": [["label1",2], ["label2",5],["label4",5]]
    	},
    "negative": {
        "Greet": [["label1",2],["label2",2],["label4",2]],
        "Aceept": [["label1",2],["label3",4]]
    	}
	}

    str = mlutils.bars.expl_struct(explanation)
    _.isEqual(str,original).should.equal(true)    
	})

	it('correctly divides labels', function() {
		_.isEqual(mlutils.bars.bag_of_labels_to_components(['Offer']),[['Offer'],[],[]]).should.equal(true)
		_.isEqual(mlutils.bars.bag_of_labels_to_components(['Offer', 'Salary', 'Accept']),[['Offer','Accept'],['Salary'],[]]).should.equal(true)
		_.isEqual(mlutils.bars.bag_of_labels_to_components(['Offer', 'Salary', 'Accept', '20,000 NIS', 'QA']),[['Offer','Accept'],['Salary'],['20,000 NIS','QA']]).should.equal(true)
		_.isEqual(mlutils.bars.bag_of_labels_to_components([true,'Greet']),[['Greet'], [], [ true]]).should.equal(true)
	})

	it('correctly sees ambiguity', function() {
		_.isEqual(mlutils.bars.semlang_ambiguity(['Offer', '20,000 NIS']), [[ 'Offer', 'Salary', '20,000 NIS' ]]).should.equal(true)
		_.isEqual(mlutils.bars.semlang_ambiguity([true]), [ [ 'Greet', true ], [ 'Quit', true ] ]).should.equal(true)
		_.isEqual(mlutils.bars.semlang_ambiguity(['Accept', '20,000 NIS']), []).should.equal(true)
		_.isEqual(mlutils.bars.semlang_ambiguity(['20,000 NIS']), [['Offer','Salary','20,000 NIS']]).should.equal(true)
		mlutils.bars.semlang_ambiguity(['previous']).length.should.equal(4)
	})

	it('correctly generate labels', function() {
		_.isEqual(mlutils.bars.generate_possible_labels([['Offer'],['Salary'],['20,000 NIS']]), [ '{"Offer":{"Salary":"20,000 NIS"}}' ]).should.equal(true)
		_.isEqual(mlutils.bars.generate_possible_labels([['Offer', 'Accept', 'Reject', 'Greet'],['Salary', 'Job description'],['20,000 NIS','previous']]),[ '{"Offer":{"Salary":"20,000 NIS"}}','{"Accept":"previous"}','{"Accept":"Salary"}','{"Reject":"previous"}','{"Reject":"Salary"}' ]).should.equal(true)
		_.isEqual(mlutils.bars.generate_possible_labels([['Greet'],[],[true]]),[ '{"Greet":true}' ]).should.equal(true)
	})
	
	it('correctly join labels', function() {
	_.isEqual(mlutils.bars.join_labels([['1'],['3'],['5']],[['2'],['4'],['6']]), [ [ '1', '2' ], [ '3', '4' ], [ '5', '6' ] ]).should.equal(true)
	})

	it('correctly resolve emptiness', function() {
		_.isEqual(mlutils.bars.resolve_emptiness([['Accept'],[],['20,000 NIS', 'QA']]), [ [ 'Accept', 'Offer' ],[ 'Salary', 'Job Description' ],[ '20,000 NIS', 'QA' ] ]).should.equal(true)
		_.isEqual(mlutils.bars.resolve_emptiness([[],[],['20,000 NIS']]), [['Offer'],['Salary'],['20,000 NIS']]).should.equal(true)
	})

})
