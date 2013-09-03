/**
 * Small utility for writing a dataset in tab-separated-values format.
 *
 * @author Erel Segal-Halevi
 * @since 2013-08
 */


/**
 * Write the dataset, one sample per line, with the given separator between sample and output. 
 */
exports.toTSV = function(dataset, separator) {
	if (!separator) separator="\t"; 
	dataset.forEach(function(sample) {
		console.log(JSON.stringify(sample.input)+separator+"["+sample.output+"]");
	});
}
