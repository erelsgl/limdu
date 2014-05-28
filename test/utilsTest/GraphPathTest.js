var ulist = require('../../utils/list');
var should = require('should');
var _ = require('underscore');
var natural = require('natural');
var cheapest_paths = require("../../node_modules/graph-paths/graph-paths").cheapest_paths;


describe('Test two function for finding shortest path', function() {

	it('the paths are equal', function() {

		_(5).times(function(n){
	  		var rows = _.random(4, 8)
	  		var mat = []

	  		_(rows).times(function(row){
	  			var list = []
	  			_(rows).times(function(n){list.push(Infinity)})
				_(rows).times(function(col){
	  				if (col>row)
	  					list[col] = - Math.random()
	  				if (col == row)
	  					list[col] = 0
	  			})
	  			mat.push(list)
	  		})

	  		var EdgeWeightedDigraph = natural.EdgeWeightedDigraph;
			var digraph = new EdgeWeightedDigraph();

			_.each(mat, function(row, key, list){
				_.each(row, function(value, key1, list1){ 
					if ((value != Infinity)&&(key1>key))
						digraph.add(key, key1, value);
				}, this) 
			}, this)

			var ShortestPathTree = natural.ShortestPathTree;
			var spt = new ShortestPathTree(digraph, 0);
			var path = spt.pathTo(3);

			var cheapestSegmentClassificationCosts = cheapest_paths(mat, 0);
			var cheapestSentenceClassificationCost = cheapestSegmentClassificationCosts[3];
			var cheapestClassificationPath = cheapestSentenceClassificationCost.path;

			_.isEqual(cheapestClassificationPath, path).should.equal(true)
		})
		
		})
})