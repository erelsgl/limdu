/**
 * a unit-test for Multi-Label classification
 * 
 * @author Erel Segal-Halevi
 * @since 2013-08
 */

var should = require('should');
var classifiers = require('../../../classifiers');
require('../../sorted');

var explain = 0;

var classifier = new classifiers.multilabel.PassiveAggressive({
	Constant: 5.0,
	retrain_count: 10,
});

describe('Multi-Label PA Classifier Trained on Single-class inputs', function() {
	classifier.trainBatch([
		{input: {I:1 , want:1 , aa:1}, output: ['A']},
		{input: {I:1 , want:1 , bb:1}, output: ['B']},
		{input: {I:1 , want:1 , cc:1}, output: ['{"C":"c"}']},
	]);

	it('classifies 1-class samples', function() {
		classifier.classify({I:1 , want:1 , aa:1 }).should.eql(['A']);
		classifier.classify({I:1 , want:1 , bb:1 }).should.eql(['B']);
		classifier.classify({I:1 , want:1 , cc:1 }).should.eql(['{"C":"c"}']);
	})

	it('classifies 2-class samples', function() {
		classifier.classify({I:1 , want:1 , aa:1 , and:1 , bb:1 }).sorted().should.eql(['A','B']);
		classifier.classify({I:1 , want:1 , bb:1 , and:1 , cc:1 }).sorted().should.eql(['B','{"C":"c"}']);
		classifier.classify({I:1 , want:1 , cc:1 , and:1 , aa:1 }).sorted().should.eql(['A','{"C":"c"}']);
	})

	it.skip('classifies 3-class samples', function() {
		var abc = classifier.classify({I:1 , want:1 , aa:1 , and:1 , bb:1 , "'":1, cc:1 }, /*explain=*/3);
		//console.dir(classifier);
		//console.dir(abc);
		abc.classes.sorted().should.eql(['A','B','{"C":"c"}']);
	})
	
	it('knows its classes', function() {
		classifier.getAllClasses().should.eql(['A','B','{"C":"c"}']);
	})

	it('explains its decisions', function() {
		classifier.classify({I:1 , want:1 , aa:1 , and:1 , bb:1 }, /*explain=*/1).should.have.property('explanation').with.lengthOf(3);
		classifier.classify({I:1 , want:1 , aa:1 , and:1 , bb:1 }, /*explain=*/3).should.have.property('explanation').with.lengthOf(3);
	})
	
	it('supports ranking with scores', function() {
		var a = classifier.classify({I:1 , want:1 , aa:1 }, /*explain=*/0, /*withScores=*/true);
		//console.dir(a);
		a.should.have.lengthOf(3);
		a[0][0].should.eql('A');
		a[0][1].should.be.above(0);
		a[1][1].should.be.below(0);
		var b = classifier.classify({I:1 , want:1 , bb:1 }, /*explain=*/0, /*withScores=*/true)
		b.should.have.lengthOf(3);
		b[0][0].should.eql('B');
		b[0][1].should.be.above(0);
		b[1][1].should.be.below(0);
		var c = classifier.classify({I:1 , want:1 , cc:1 }, /*explain=*/0, /*withScores=*/true);
		c.should.have.lengthOf(3);
		c[0][0].should.eql('{"C":"c"}');
		c[0][1].should.be.above(0);
		c[1][1].should.be.below(0);
	});

	//it('should classify 0-class samples', function() {
	//	classifier.classify({I:1 , want:1 , nothing:1 },explain).sorted().should.eql([]);
	//})
})
