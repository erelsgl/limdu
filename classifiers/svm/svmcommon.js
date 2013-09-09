/**
 * Utilities common to SVM wrappers
 */

var temp = require('temp')
  , fs   = require('fs')
  , svmlight = require('../../formats/svmlight')

/**
 * Writes the given dataset to a file in svm-light format.
 * @return the file name.
 */
module.exports.writeDatasetToFile = function(dataset, bias, binarize, model_file_prefix, default_file_prefix) {
	if (model_file_prefix) {
		var learnFile = model_file_prefix+".learn";
		var fd = fs.openSync(learnFile, 'w');
	} else {
		var tempFile = temp.openSync({prefix:default_file_prefix+"-", suffix:".learn"});
		var learnFile = tempFile.path;
		var fd = tempFile.fd;
	}
	var datasetSvmlight = svmlight.toSvmLight(dataset, bias, binarize);
	fs.writeSync(fd, datasetSvmlight);
	fs.closeSync(fd);
	
	return learnFile;
}

/**
 * A utility that classifies a given sample (given as a feature-value map) using a model (given as a feature-weight map).
 * @param features a map {feature_i: value_i, ....} (i >= 1)
 * @param modelMap a map {feature_i: weight_i, ....} (i >= 1)
 * @returns a classification value.
 */
module.exports.classifyWithModelMap = function (modelMap, bias, features, explain, continuous_output) {
	if (explain>0) var explanations = [];
	if (bias)
		features.unshift(bias);
	var result = 0;
	for (var feature in features) {
		if (feature in modelMap) {
			var weight = modelMap[feature];
			var value = features[feature];
			var relevance = weight*value;
			result += relevance;

			if (explain>0) explanations.push(
					{
						feature: feature,
						value: value,
						weight: weight,
						relevance: relevance,
					}
			);
		}
	}
	
	if (!continuous_output)
		result = (result>0? 1: 0);
	if (explain>0) {
		explanations.sort(function(a,b){return Math.abs(b.relevance)-Math.abs(a.relevance)});
		explanations.splice(explain, explanations.length-explain);  // "explain" is the max length of explanation.
		
		if (!this.detailed_explanations) {
			var sprintf = require('sprintf').sprintf;
			explanations = explanations.map(function(e) {
				return sprintf("%s%+1.2f", e.feature, e.relevance);
			});
		}
		return {
			classification: result,
			explanation: explanations
		};
	} else {
		return result;
	}
}

