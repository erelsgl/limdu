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
	
	// add all features in the given hash or array
	addFeatures: function(hash) {
		if (hash instanceof Array) {
			for (var index in hash)
				this.addFeature(hash[index]);
		} else if (hash instanceof Object) {
			for (var feature in hash)
				this.addFeature(feature);
		} 
		else throw new Error("FeatureLookupTable.addFeatures expects a hash or an array, but got: "+JSON.stringify(hash));
	},

	// add all features in all hashes in the given array
	addFeaturess: function(hashes) {
		for (var i=0; i<hashes.length; ++i)
			this.addFeatures(hashes[i]);
	},
	
	/**
	 * Convert the given feature to a numeric index.
	 */
	featureToNumber: function(feature) {
		this.addFeature(feature);
		return this.featureNameToFeatureIndex[feature];
	},
	
	numberToFeature: function(number) {
		return this.featureIndexToFeatureName[number];
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
		for (var featureIndex=0; featureIndex<this.featureIndexToFeatureName.length; ++featureIndex)
			array[featureIndex]=0;
		if (hash instanceof Array) {
			for (var i in hash)
				array[this.featureNameToFeatureIndex[hash[i]]] = true;
		} else if (hash instanceof Object) {
			for (var feature in hash)
				array[this.featureNameToFeatureIndex[feature]] = hash[feature];
		}
		else throw new Error("Unsupported type: "+JSON.stringify(hash));
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
	
	
	toJSON: function() {
		return {
			featureIndexToFeatureName: this.featureIndexToFeatureName,
			featureNameToFeatureIndex: this.featureNameToFeatureIndex,
		}
	},
	
	fromJSON: function(json) {
		this.featureIndexToFeatureName = json.featureIndexToFeatureName;
		this.featureNameToFeatureIndex = json.featureNameToFeatureIndex;
	},
}

module.exports = FeatureLookupTable;
