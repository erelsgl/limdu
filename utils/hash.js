/**
 * Static utilities for hashes (= associative arrays = Javascript objects).
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 * @note see performance tests of adding hashes versus arrays here: http://jsperf.com/adding-sparse-feature-vectors
 */


/**
 * create a hash from a string in the format:
 
 * key1 / value1
 * key2 / value2
 * ...
 *
 * Comments start with '#' and end with end-of-line.
 */
exports.fromString = function(string) {
	var lines = string.split(/[\n\r]/g);
	var hash = {};
	for (var i=0; i<lines.length; ++i) {
		var line = lines[i].trim();
		line = line.replace(/\s*#.*?$/, "");  // remove comments
		if (line.length<1) continue; // skip empty lines

		var parts = line.split(/\s*\/\s*/);
		if (parts.length<2 || !parts[0] || !parts[1]) {
			console.dir(parts);
			throw new Error("empty key or value");
		}
		var key = parts[0];
		var value = parts[1];
		if (key in hash) {
			console.warn("key "+key+" already exists. Old value="+hash[key]+", new value="+value);
		}
		hash[key]=value;
	}
	return hash;
};

/**
 * add one hash to another (target += source)
 * @param target [input and output]
 * @param source [input]: will be added to target.
 */
exports.add  = function(target, source) {
	for (var feature in source) {
		if (!(feature in target))
			target[feature]=0;
		if (toString.call(target[feature]) != '[object Number]') continue;
		target[feature] += source[feature];
	}
	return target;
};
 
/**
 * add one hash to another (target += scalar * source)
 * @param target [input and output]
 * @param source [input]
 * @param scalar [input]
 */
exports.addtimes  = function(target, scalar, source) {
	for (var feature in source) {
		if (!(feature in target))
			target[feature]=0;
		if (toString.call(target[feature]) != '[object Number]') continue;
		target[feature] += scalar*source[feature];
	}
	return target;
};

/**
 * multiply one hash by another (elementwise multiplication).
 * @param target [input and output]
 * @param source [input]: target will be multiplied by it.
 */
exports.multiply  = function(target, source) {
	for (var feature in source) {
		if (!(feature in target))
			target[feature]=1;
		if (toString.call(target[feature]) != '[object Number]') continue;
		target[feature] *= source[feature];
	}
	return target;
};

/**
 * multiply a hash by a scalar.
 * @param target [input and output]
 * @param source [input]: target will be multiplied by it.
 */
exports.multiply_scalar  = function(target, source) {
	for (var feature in target) {
		if (toString.call(target[feature]) != '[object Number]') continue;
		target[feature] *= source;
	}
	return target;
};

/**
 * calculate the scalar product (dot product) of the given two hashes.
 * @param features [input] - a hash representing a 1-dimensional vector.
 * @param weights [input] - a hash representing a 1-dimensional vector.
 * @return a scalar - the sum of elementwise products.
 * @note Usually, there are much less features than weights.
 */
exports.inner_product = function(features, weights) {
	var result = 0;
	for (var feature in features) {
			if (feature in weights) {
				result += features[feature] * weights[feature];
			} else {
					/* the sample contains a feature that was never seen in training - ignore it for now */ 
			}
	}
	return result;
};

/**
 * calculate the vector dot product of the given two hashes.
 * @param features [input] - a hash representing a 1-dimensional vector.
 * @param weights [input] - a hash of hashes, representing a 2-dimensional matrix.
 * @return a hash - for each key of weights, return the dot product of the given row with the features vector.
 * @note Usually, there are much less features than weights.
 */
exports.inner_product_matrix = function(features, weights) {
	var result = {};
	for (category in weights) {
		result[category] = exports.inner_product(features, weights[category]);
	}
	return result;
};

exports.sum_of_values = function(weights) {
	var result = 0;
	for (var feature in weights)
		result += weights[feature];
	return result;
};

exports.sum_of_absolute_values = function(weights) {
	var result = 0;
	for (var feature in weights)
		result += Math.abs(weights[feature]);
	return result;
};

exports.sum_of_square_values = function(weights) {
	var result = 0;
	for (var feature in weights)
		result += Math.pow(weights[feature],2);
	return result;
};

/**
 * Normalize the given hash, such that the sum of values is 1.
 * Unless, of course, the current sum is 0, in which case, nothing is done. 
 */
exports.normalize_sum_of_values_to_1 = function(features) {
	var sum = exports.sum_of_absolute_values(features);
	if (sum!=0)
		exports.multiply_scalar(features, 1/sum);
};

/**
 * Normalize the given hash, such that the sum of squares of the values is 1.
 * Unless, of course, the current sum is 0, in which case, nothing is done. 
 */
exports.normalize_sum_of_squares_to_1 = function(features) {
	var sum = exports.sum_of_square_values(features);
	if (sum!=0)
		exports.multiply_scalar(features, 1/Math.sqrt(sum));
};


/**
 * @param array [input]
 * @return a string of the given hash, sorted by keys.
 */
exports.stringify_sorted = function(weights, separator) {
	var result = "{" + separator;
	var keys = Object.keys(weights);
	keys.sort();
	var last = keys.length-1;
	for (var i=0; i <= last; i++) {
		var key = keys[i];
		var weight = weights[key]; 
		result += '"'+key+'": '+weight;
		if (i<last) result+=",";
		result += separator;
	}
	result += "}";
	return result;	
};


/**
 * Convert any object to a hash (representing a set):
 *
 * - an array ['a', 'b', 'c'..] to a hash {'a': true, 'b': true, 'c': true};
 * - a string 'a' to a hash {'a': true}.
 */
exports.normalized = function(object) {
	if (Array.isArray(object)) {
		var result = {}; 
		for (var i=0; i<object.length; ++i) 
			result[stringifyIfNeeded(object[i])]=true;
		return result;
	} else if (object instanceof Object) {
		return object;
	} else {
		var result = {};
		result[stringifyIfNeeded(object)]=true; 
		return result;
	}
};


var stringifyIfNeeded = function (label) {
	return (typeof(label)==='string'? label: JSON.stringify(label));
};

/*
var toStringOrStringArray = function (classes) {
	if (classes instanceof Array)
		classes = classes.map(stringifyIfNeeded);
	else 
		classes = stringifyIfNeeded(classes);
	return hash.normalized(classes);
}
*/
