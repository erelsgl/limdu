/**
 * FeatureLookupTable - a table for converting features to numbers and vice versa 
 */

var FeatureLookupTable = function() {
	this.featureIndexToFeatureName = [undefined];
	this.featureNameToFeatureIndex = {undefined: 0};
}

FeatureLookupTable.prototype = {
	
	// add a single feature, if it does not exist
	addFeature: function(feature) {
		if (!(feature in this.featureNameToFeatureIndex)) {
			var newIndex = this.featureIndexToFeatureName.length;
			this.featureIndexToFeatureName.push(feature);
			this.featureNameToFeatureIndex[feature] = newIndex;
		}
	},
	
	// add all features in the given hash
	addFeatures: function(hash) {
		for (var feature in hash)
			this.addFeature(feature);
	},

	// add all features in all hashes in the given array
	addFeaturess: function(hashes) {
		for (var i=0; i<hashes.length; ++i)
			this.addFeatures(hashes[i]);
	},
		
	/**
	 * Convert the given hash of features to a numeric array, using 0 for padding.
	 * If some features in the hash do not exist - they will be added.
	 * @param hash any hash, for example, {a: 111, b: 222, c: 333}
	 * @return a matching array, based on the current feature table. For example: [0, 111, 222, 0, 333]
	 * @note some code borrowed from Heather Arthur: https://github.com/harthur/brain/blob/master/lib/lookup.js
	 */
	hashToArray: function(hash) {
		this.addFeatures(hash);
		var array = [];
		for (var feature in this.featureNameToFeatureIndex)
			array[this.featureNameToFeatureIndex[feature]] = hash[feature] || 0;
		return array;
	},
	
	/**
	 * Convert all the given hashes of features to numeric arrays, using 0 for padding.
	 * If some features in some of the hashes do not exist - they will be added.
	 * @param hashes an array of hashes, for example, [{a: 111, b: 222}, {a: 11, c: 33}, ...] 
	 * @return an array of matching arrays, based on the current feature table. For example: [[111, 222], [11, 0, 33]]
	 */
	hashesToArrays: function(hashes) {
		this.addFeaturess(hashes);
	  
		var arrays = [];
		for (var i=0; i<hashes.length; ++i) {
			arrays[i] = [];
			for (var feature in this.featureNameToFeatureIndex)
				arrays[i][this.featureNameToFeatureIndex[feature]] = hashes[i][feature] || 0;
		}
		return arrays;
	},

	/**
	 * Convert the given numeric array to a hash of features, ignoring zero values.
	 * @note some code borrowed from Heather Arthur: https://github.com/harthur/brain/blob/master/lib/lookup.js
	 */
	arrayToHash: function(array) {
		var hash = {};
		for (var feature in this.featureNameToFeatureIndex) {
			if (array[this.featureNameToFeatureIndex[feature]])
				hash[feature] = array[this.featureNameToFeatureIndex[feature]];
		}
		return hash;
	},
	
	/**
	 * Convert the given numeric arrays to array of hashes of features, ignoring zero values.
	 */
	arraysToHashes: function(arrays) {
		var hashes = [];
		for (var i=0; i<arrays.length; ++i)
			hashes[i] = this.arrayToHash(arrays[i]);
		return hashes;
	},
}

module.exports = FeatureLookupTable;
