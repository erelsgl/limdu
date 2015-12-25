var hash = require("../../utils/hash");
var sprintf = require("sprintf").sprintf;
var _ = require("underscore")._;
var fs = require('fs');
var partitions = require('../../utils/partitions');
var crypto = require('crypto')
var execSync = require('child_process').execSync
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

var Adaboost = function(opts) {
	if (!Adaboost.isInstalled()) {
		var msg = "Cannot find the executable 'icsiboost'.";
		console.error(msg)
		throw new Error(msg); 
	}

	this.set_of_labels = []
	this.text_expert = 'ngram'
	this.assigner = crypto.randomBytes(20).toString('hex');
	this.folder = "icsiboost_data"

	this.ngram_length = opts.ngram_length || 2
	this.iterations = opts.iterations || 2000
}

Adaboost.isInstalled = function() {
    try {
        var result = execSync("icsiboost");
        return true;
    } catch (err) {
        return false;
    }
}

Adaboost.prototype = {

	trainOnline: function(sample, labels) {
	
	},

	trainBatch : function(dataset) {

		set_of_labels = []
		_.times(1, function(){dataset = _.shuffle(dataset)})
		_.each(dataset, function(value, key, list){ 
			_.each(value['output'], function(value1, key, list){
				set_of_labels.push(this.stringifyClass(value1))
			},this)
		}, this);

		this.set_of_labels = _.uniq(set_of_labels)

		if (this.set_of_labels.length == 1) {return 0}

		dataset = _.map(dataset, function(value){ 
			values = []
				_.each(value['output'], function(value1, key, list){ 
				values.push(this.set_of_labels.indexOf(this.stringifyClass(value1))+1)
			}, this);

			return {'input':value['input'], 'output': values}
		}, this);
	
		ar = []
		_.times(this.set_of_labels.length, function(n){ar.push(n+1)})

  		try {(!fs.statSync(this.folder).isDirectory())}
  		catch(e) {fs.mkdirSync(this.folder)}
  			
		names = ar.join()+".\nsentence:text:expert_type="+this.text_expert+" expert_length="+this.ngram_length+"."
	 	fs.writeFileSync("./"+this.folder+"/"+this.assigner+'.names', names)

		set = {}
		dataset = partitions.partition(dataset, 1, Math.round(dataset.length*0.3))
		set['data'] = dataset['train']
		set['dev']  = dataset['test']	

		_.each(set, function(valueset, key1, list){ 
			str = ""
			_.each(valueset, function(value, key, list){
					if (value['input'].length <= 1) return
	    			str += value['input'].replace(/\,/g,'') + ',' + value['output'].join(" ")+ ".\n"
	    			//str += value['input']+ ',' + value['output'].join(" ")+ ".\n"
	    		})   

			fs.writeFileSync("./"+this.folder+"/"+this.assigner+"."+key1, str)
		}, this)

		var result = execSync("icsiboost -S ./"+this.folder+"/"+this.assigner+" -n "+this.iterations)
		console.log(result)
	},

	classify: function(sample, explain) {

		if (this.set_of_labels.length == 1) {return this.set_of_labels[0]}

		fs.writeFileSync("./"+this.folder+"/"+this.assigner+".test", sample.replace(/\,/g,'')+"\n")
		fs.writeFileSync("./"+this.folder+"/"+this.assigner+".test", sample+"\n")
		var result = execSync("icsiboost -S ./"+this.folder+"/"+this.assigner +" -W "+this.ngram_length+" -N "+this.text_expert+" -C < ./"+this.folder+"/"+this.assigner+".test > ./"+this.folder+"/"+this.assigner+".output")
		var stats = fs.readFileSync("./"+this.folder+"/"+this.assigner+".output", "utf8");

		set_of_labels = this.set_of_labels

		stats = stats.replace(/^\s+|\s+$/g, "");
		ar = stats.split(" ")

		actual = ar.slice(ar.length/2, ar.length)

		actual1 = []

		_.each(actual, function(value, key){ 
			if (value>0) {
				actual1.push(set_of_labels[key])}
			})
	
		return actual1
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


module.exports = Adaboost;

// ./icsiboost  -C  -W 3 -N ngram  -S agent < agent.test
// ./icsiboost  -S agent -n 1500
