/* Implementation of Decision Tree classifier, ID3 implementation
   the code based on https://github.com/bugless/nodejs-decision-tree-id3/blob/master/lib/decision-tree.js
 */
var _ = require('underscore');
var hash = require("../../utils/hash");
var sprintf = require("sprintf-js").sprintf;  // for explanations

function DecisionTree(opts) {
	if (!opts) opts = {}
	// this.debug = opts.debug || false; 
}

DecisionTree.prototype = {
		
		toJSON: function(folder) {
			return this.root
		},

		fromJSON: function(json) {
			this.root = json
		},

		createTree: function(dataset, features) {
			var targets = _.unique(_.pluck(dataset, 'output'));
			if (targets.length == 1){
                // console.log("end node! "+targets[0]);
                return {type:"result", val: targets[0], name: targets[0], alias:targets[0]+this.randomTag() }; 
        	}
        	 if(features.length == 0){
                // console.log("returning the most dominate feature!!!");
                var topTarget = this.mostCommon(targets);
                return {type:"result", val: topTarget, name: topTarget, alias: topTarget+this.randomTag()};
        	}
        	var bestFeature = this.maxGain(dataset, features);
			var remainingFeatures = _.without(features,bestFeature);
        	var possibleValues = _.unique(_.pluck(_.pluck(dataset, 'input'), bestFeature));
        	var node = {name: bestFeature,alias: bestFeature+this.randomTag()};
        	node.type = "feature";
        	node.vals = _.map(possibleValues,function(v){
                var _newS = dataset.filter(function(x) {return x['input'][bestFeature] == v});
                var child_node = {name:v,alias:v+this.randomTag(),type: "feature_value"};
                child_node.child =  this.createTree(_newS,remainingFeatures);
                return child_node;
        }, this);
        
        return node;
		},

		mostCommon: function(l) {
        	return  _.sortBy(l,function(a){ return this.count(a,l); },this).reverse()[0];
		},

		count: function(a, l) {
        	return _.filter(l,function(b) { return b === a}).length
		},

		randomTag: function() {
        	return "_r"+Math.round(Math.random()*1000000).toString();
		},

		extractFeatures: function(dataset) {
			var features = []
			for (record in dataset)
			{
				for (key in dataset[record]['input'])
				{
					features.push(key)
				}
			}
			return features
		},

		gain: function(dataset, feature){
        	var attrVals = _.unique(_.pluck(_.pluck(dataset, 'input'), feature));
            var setEntropy = this.entropy(_.pluck(dataset, 'output'));
        	var setSize = _.size(dataset);
        	var entropies = attrVals.map(function(n){
            	var subset = dataset.filter(function(x){return x['input'][feature] === n});
                return (subset.length/setSize)*this.entropy(_.pluck(subset,'output'));
        	 }, this);
        	var sumOfEntropies =  entropies.reduce(function(a,b){return a+b},0);
        	return setEntropy - sumOfEntropies;
		},
		
		entropy: function(vals){
	        var uniqueVals = _.unique(vals);
	        var probs = uniqueVals.map(function(x){return this.prob(x,vals)}, this);
	        var logVals = probs.map(function(p){return -p*this.log2(p) }, this);
	        return logVals.reduce(function(a,b){return a+b},0);
		},

		prob: function(val,vals){
	        var instances = _.filter(vals,function(x) {return x === val}).length;
	        var total = vals.length;
	        return instances/total;
		},

		log2: function(n){
	        return Math.log(n)/Math.log(2);
		},

		maxGain: function(dataset, features) {
	        return _.max(features,function(e){return this.gain(dataset,e)}, this)
		},

		setFeatureLookupTable: function(featureLookupTable) {
			this.featureLookupTable = featureLookupTable;
		},
		
  		/**
		 * Batch training (a set of samples). Uses the option this.retrain_count.
		 *
		 * @param dataset an array of samples of the form {input: {feature1: value1...} , output: 0/1} 
		 */
		trainBatch: function(dataset) {
			features = this.extractFeatures(dataset)
			this.root = this.createTree(dataset, features)
		},
		
		/**
		 * @param inputs a SINGLE sample (a hash of feature-value pairs).
		 * @param continuous_output if true, return the net classification value. If false [default], return 0 or 1.
		 * @param explain - int - if positive, an "explanation" field, with the given length, will be added to the result.  
		 * @return the classification of the sample.
		 */
		classify: function(features, explain, continuous_output) {
		    root = this.root;
            while (root.type !== "result") {
                var attr = root.name;
                var sampleVal = features[attr];
                        var childNode = _.detect(root.vals,function(x) { return x.name == sampleVal });
                        if (childNode) {
                                root = childNode.child;
                        } else {
                                root = root.vals[0].child;
                        }
                }
            return root.val;
		},
}

module.exports = DecisionTree;

