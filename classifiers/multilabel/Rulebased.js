var hash = require("../../utils/hash");
var _ = require("underscore")._;
var Hierarchy = require(__dirname+"/../../../nlu-server/Hierarchy.js");
var bars = require(__dirname+"/../../../nlu-server/utils/bars.js");
var rules = require(__dirname+"/../../../nlu-server/research/rule-based/rules.js");
var ftrs = require(__dirname+"/../../features");
var fs = require('fs');

/**
 * Adaptive Boosting (Adaboost) is a greedy search for a linear combination of 
 * classifiers by overweighting the examples that are misclassified by each 
 * classifier. icsiboost implements Adaboost over stumps (one-level decision trees) 
 * on discrete and continuous attributes (words and real values). 
 * See http://en.wikipedia.org/wiki/AdaBoost and the papers by Y. Freund and R. Schapire for more details.
 * 
 * @param opts
 *            ngram_length (optional) 
 *            iterations (optional) 
 *  
 * The class uses icsiboost open-source implementation of Boostexter
 * https://code.google.com/p/icsiboost/
 */

var regexpNormalizer = ftrs.RegexpNormalizer(
		JSON.parse(fs.readFileSync(__dirname+'/../../../nlu-server/knowledgeresources/BiuNormalizations.json')));

var Rulebased = function(opts) {

	// console.log(JSON.stringify( opts.ClassifierType, null, 4))
	// console.log(JSON.stringify( opts.ClassifierType(), null, 4))

	this.classifier = new opts.ClassifierType();
	}

Rulebased.prototype = {

	trainOnline: function(sample, labels) {
	},

	trainBatch : function(dataset) {

		_.map(dataset, function(utterance){

			sentence = utterance.input.text
			sentence = sentence.toLowerCase().trim()
			sentence = regexpNormalizer(sentence)
			
			sentence_clean = rules.generatesentence({'input':sentence, 'found': rules.findData(sentence)})['generated']
			sentence_clean = sentence_clean.replace(/<VALUE>/g,'')
			sentence_clean = sentence_clean.replace(/<ATTRIBUTE>/g,'')
			sentence_clean = sentence_clean.replace(/NIS/,'')
			sentence_clean = sentence_clean.replace(/nis/,'')
			sentence_clean = sentence_clean.replace(/track/,'')
			sentence_clean = sentence_clean.replace(/USD/,'')
			sentence_clean = sentence_clean.trim()

			var output = _.map(utterance.output, function(num){ return Hierarchy.splitPartEquallyIntent(num) });

			utterance.input.text = sentence_clean
			utterance.output = _.uniq(_.flatten(output))

		});

		this.classifier.trainBatch(dataset)
		// console.log(JSON.stringify(dataset, null, 4))
		// process.exit(0)
	},

	classify: function(sample, explain) {
		
		// console.log(JSON.stringify(sample, null, 4))

		sentence = sample.text
		sentence = sentence.toLowerCase().trim()
		sentence = regexpNormalizer(sentence)
		var results = rules.findData(sentence)
		
		var attr = results[0]
		var values = results[1]

		var attr_list = _.map(attr, function(num){ return num[0] });
		var values_list = _.map(values, function(num){ return num[0] });

		// console.log(JSON.stringify(attr_list, null, 4))
		// console.log(JSON.stringify(values_list, null, 4))

		sentence_clean = rules.generatesentence({'input':sentence, 'found': rules.findData(sentence)})['generated']
		sentence_clean = sentence_clean.replace(/<VALUE>/g,'')
		sentence_clean = sentence_clean.replace(/<ATTRIBUTE>/g,'')
		sentence_clean = sentence_clean.replace(/NIS/,'')
		sentence_clean = sentence_clean.replace(/nis/,'')
		sentence_clean = sentence_clean.replace(/track/,'')
		sentence_clean = sentence_clean.replace(/USD/,'')
		sentence_clean = sentence_clean.trim()

		sample.text = sentence_clean

		var classes = this.classifier.classify(sample, 50)

		var intents = classes.classes

		// console.log(JSON.stringify(intents, null, 4))

		var labels = bars.generate_labels([intents,attr_list,values_list])

		// console.log(JSON.stringify(labels, null, 4))
		// console.log(JSON.stringify("---------------------------------------------------", null, 4))
		return {'classes': labels}
	},
	
	getAllClasses: function() {
	},

	stringifyClass: function (aClass) {
		return (_(aClass).isString()? aClass: JSON.stringify(aClass));
	},

	toJSON : function() {
	},

	fromJSON : function(json) {
	},
	
	setFeatureLookupTable: function(featureLookupTable) {
	
	},
}


module.exports = Rulebased;