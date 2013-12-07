/**
 * Utilities for lists
 * 
 * @author Vasily Konovalov
 */
var _ = require('underscore');

// Calculating the median of an array basically involves sorting the array and picking the middle number. 
// If it’s an even amount of numbers you take the two numbers in the middle and average them.
exports.median =  function(values) {
 	    values.sort(function(a,b) {return a - b;} );
	    var half = Math.floor(values.length/2);
	    if(values.length % 2)
	        return values[half];
	    else
	        return (values[half-1] + values[half]) / 2.0;
	}

exports.variance = function(list)
	{
		sum = _.reduce(list, function(memo, num){ return memo + num; }, 0);
		exp = sum/list.length
		sum2 = _.reduce(list, function(memo, num){ return memo + num*num; }, 0);
		exp2 = sum2/list.length
		return exp2-exp*exp
	}

exports.average = function(list)
	{
		sum = _.reduce(list, function(memo, num){ return memo + num; }, 0);
		return sum/list.length
	}

exports.is_equal_set = function(set1, set2)
	{
	if ((!set1) && (set2)) {return false}
	if (set1.length != set2.length) {return false}
	if ((_.difference(set1, set2).length==0) && (_.difference(set2, set1).length==0))
		{return true}
	else
		{return false}
	}
