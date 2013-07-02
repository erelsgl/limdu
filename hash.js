/**
 * Static utilities for hashes (= associative arrays = Javascript objects).
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */
 
/**
 * add one hash to another.
 * @param target [input and output]
 * @param source [input]: will be added to target.
 */
exports.add  = function(target, source) {
	for (var feature in source) {
		if (!(feature in target))
			target[feature]=0;
		if (target[feature] instanceof Function)
			continue;
		target[feature] += source[feature];
	}
}

/**
 * multiply one associative array by another.
 * @param target [input and output]
 * @param source [input]: target will be multiplied by it.
 */
exports.multiply  = function(target, source) {
	for (var feature in source) {
		if (!(feature in target))
			target[feature]=1;
		if (target[feature] instanceof Function)
			continue;
		target[feature] *= source[feature];
	}
}

/**
 * multiply an associative array by a scalar.
 * @param target [input and output]
 * @param source [input]: target will be multiplied by it.
 */
exports.multiply_scalar  = function(target, source) {
	for (var feature in target) {
		if (target[feature] instanceof Function)
			continue;
		target[feature] *= source;
	}
}

/**
 * calculate the scalar product of the given two arrays.
 * @param features [input]
 * @param weights [input]
 * @note Usually, there are much less features than weights.
 */
exports.inner_product = function(features, weights) {
	var result = 0;
	for (var feature in features) {
			if (feature in weights) {
					result += features[feature] * weights[feature]
			} else {
					/* the sample contains a feature that was never seen in training - ignore it for now */ 
			}
	}
	return result;
}

exports.sum_of_values = function(weights) {
	var result = 0;
	for (var feature in weights)
		result += weights[feature];
	return result;
}

exports.sum_of_absolute_values = function(weights) {
	var result = 0;
	for (var feature in weights)
		result += Math.abs(weights[feature]);
	return result;
}

exports.sum_of_square_values = function(weights) {
	var result = 0;
	for (var feature in weights)
		result += Math.pow(weights[feature],2);
	return result;
}

/**
 * Normalize the given associative array, such that the sum of values is 1.
 * Unless, of course, the current sum is 0, in which case, nothing is done. 
 */
exports.normalize_sum_of_values_to_1 = function(features) {
	var sum = exports.sum_of_absolute_values(features);
	if (sum!=0)
		exports.multiply_scalar(features, 1/sum);
}

/**
 * Normalize the given associative array, such that the sum of squares of the values is 1.
 * Unless, of course, the current sum is 0, in which case, nothing is done. 
 */
exports.normalize_sum_of_squares_to_1 = function(features) {
	var sum = exports.sum_of_square_values(features);
	if (sum!=0)
		exports.multiply_scalar(features, 1/Math.sqrt(sum));
}


/**
 * @param array [input]
 * @return a string of the given associative array, sorted by keys.
 */
exports.stringify_sorted = function(weights, separator) {
	var result = "{" + separator;
	var keys = Object.keys(weights);
	keys.sort();
	var last = keys.length-1;
	for (i = 0; i <= last; i++) {
		var key = keys[i];
		var weight = weights[key]; 
		result += '"'+key+'": '+weight;
		if (i<last) result+=",";
		result += separator;
	}
	result += "}";
	return result;	
}

/**
 * Convert an array ['a', 'b', 'c'..] to an object {'a': true, 'b': true, 'c': true}
 *
 * NOT NEEDED: Use underscore: _.invert(array)
exports.fromArray = function(array) {
	var result = {}; 
	for (var i=0; i<array.length; ++i) {
		result[array[i]]=true;
	}
	return result;
}
*/