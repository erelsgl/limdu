/**
 * Utilities common to SVM wrappers
 */

var temp = require('temp')
  , fs   = require('fs')
  , svmlight = require('../../formats/svmlight')
  , _ = require('underscore')._

/**
 * Writes the given dataset to a file in svm-light format.
 * @return the file name.
 */
module.exports.writeDatasetToFile = function(dataset, bias, binarize, model_file_prefix, default_file_prefix, firstFeatureNumber) {
	if (model_file_prefix) {
		var learnFile = model_file_prefix+".learn";
		var fd = fs.openSync(learnFile, 'w');
	} else {
		var tempFile = temp.openSync({prefix:default_file_prefix+"-", suffix:".learn"});
		var learnFile = tempFile.path;
		var fd = tempFile.fd;
	}
	var datasetSvmlight = svmlight.toSvmLight(dataset, bias, binarize, firstFeatureNumber);
	fs.writeSync(fd, datasetSvmlight);
	fs.closeSync(fd);
	
	return learnFile;
}

/**
 * A utility that classifies a given sample (given as a feature-value map) using a model (given as a feature-weight map).
 * @param modelMap a map {feature_i: weight_i, ....} (i >= 0; 0 is the weight of the bias, if exists).
 * @param bias if nonzero, added at the beginning of features.
 * @param features a map {feature_i: value_i, ....} (i >= 1)
 * @param explain (int) if positive, generate explanation about the classification.
 * @param continuous_output (boolean) if true, return a score; if false, return 0 or 1.
 * @param featureLookupTable if not null, used for creating meaningful explanations.
 * @returns a classification value.
 */
module.exports.classifyWithModelMap = function (modelMap, bias, features, explain, continuous_output, featureLookupTable) {
	if (explain>0) var explanations = [];
	var result = 0;
	if (bias && modelMap[0]) {
		var weight = modelMap[0];
		var relevance = bias*modelMap[0];
		result = relevance;
		if (explain>0) explanations.push(
				{
					feature: 'bias',
					value: bias,
					weight: weight,
					relevance: relevance,
				}
		);
		
	}
	
	for (var feature in features) {
		var featureInModelMap = parseInt(feature)+(bias?1:0);
		if (featureInModelMap in modelMap) {
			var weight = modelMap[featureInModelMap];
			var value = features[feature];
			var relevance = weight*value;
			result += relevance;

			if (explain>0) explanations.push(
					{
						feature: featureLookupTable? (featureLookupTable.numberToFeature(feature)||"?"): feature,
						value: value,
						weight: weight,
						relevance: relevance,
					}
			);
		}
	}
	
	if (!continuous_output)
		result = (result>0? 1: 0);
	if (_.isNaN(result)) {
		console.dir(explanations);
		throw new Error("result is NaN when classifying "+features+" with "+JSON.stringify(modelMap))
	}
	if (explain>0) {
		explanations.sort(function(a,b){return Math.abs(b.relevance)-Math.abs(a.relevance)});
		var explanations = _.filter(explanations, function(num){ return num.relevance!=0 });

		// explanations.splice(explain, explanations.length-explain);  // "explain" is the max length of explanation.

		
		if (!this.detailed_explanations) {
			// var sprintf = require('sprintf').sprintf;
			explanations = explanations.map(function(e) {
				// return sprintf("%s%+1.2f", e.feature, e.relevance);
				return [e.feature, e.relevance];
			});

			explanations = _.sortBy(explanations, function(num){ return num[1] }).reverse()

		}
		return {
			classification: result,
			explanation: explanations
		};
	} else {
		return result;
	}
}

