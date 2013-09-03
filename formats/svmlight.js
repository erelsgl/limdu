/**
 * Small utility for writing a dataset in SVM-light format.
 *
 * @author Erel Segal-Halevi
 * @since 2013-09
 */


/**
 * convert a single dataset to compact JSON format.
 * @param dataset an array of samples in the format {input: [value1, value2, ...], output: [1,2,3]}
 */
exports.toSvmLight = function(dataset) {
	var lines = "";
	for (var i=0; i<dataset.length; ++i) {
		var line = (i>0? "\n": "") + 
			(dataset[i].output>0? "1": "-1") +  // in svm-light, the output comes first:
			featureArrayToFeatureString(dataset[i].input)
			;
		lines += line;
	};
	lines += "\n";
	return lines;
}



/**
 * convert an array of features to a single line in SVM-light format. The line starts with a space.
 */
function featureArrayToFeatureString(features) {
	var line = "";
	for (var feature=0; feature<features.length; ++feature) {
		var value = features[feature];
		if (value)
			line += (" "+(feature+1)+":"+value.toPrecision(5));
	}
	return line;
}

