/**
 * Small utility for writing a dataset in SVM-light format.
 *
 * @author Erel Segal-Halevi
 * @since 2013-09
 */


/**
 * convert a single dataset to compact JSON format.
 * @param dataset an array of samples in the format {input: [value1, value2, ...], output: (0|1)}
 */
exports.toSvmLight = function(dataset, bias) {
	var lines = "";
	for (var i=0; i<dataset.length; ++i) {
		var line = (i>0? "\n": "") + 
			(dataset[i].output>0? "1": "-1") +  // in svm-light, the output comes first:
			featureArrayToFeatureString(dataset[i].input, bias)
			;
		lines += line;
	};
	lines += "\n";
	return lines;
}



/**
 * convert an array of features to a single line in SVM-light format. The line starts with a space.
 */
function featureArrayToFeatureString(features, bias) {
	if (!Array.isArray(features))
		throw new Error("Expected an array, but got "+JSON.stringify(features))
	var line = (bias? " 1:"+bias: "");
	for (var feature=0; feature<features.length; ++feature) {
		var value = features[feature];
		if (value)
			line += (" "+(feature+1+(!!bias))+":"+value.toPrecision(5));
	}
	return line;
}
