/**
 * A wrapper for Thorsten Joachims' SVM-perf package
 * 
 * To use this wrapper, you must have SVM-perf installed, 
 * and must have its executables (svm_perf_learn, svm_perf_classify) in your path. 
 * 
 * You can download SVM-perf here: http://www.cs.cornell.edu/people/tj/svm_light/svm_perf.html
 * subject to the copyright license.
 *
 * @author Erel Segal-haLevi
 * @since 2013-09-02
 * 
 * @param opts options: <ul>
 *	<li>learn_args - a string with arguments for svm_perf_learn 
 *  <li>classify_args - a string with arguments for svm_perf_classify
 */

function SvmPerf(opts) {
	opts.learn_args = opts.learn_args || "";
	opts.classify_args = opts.classify_args || "";
}

var temp = require('temp'),
    fs   = require('fs'),
    util  = require('util'),
    exec = require('child_process').exec;

SvmPerf.prototype = {
		trainOnline: function(features, expected) {
			throw new Error("SVM-perf does not support online training");
		},

		/**
		 * Send the given dataset to svm_perf_learn.
		 *
		 * @param dataset an array of samples of the form {input: [value1, value2, ...] , output: 0/1} 
		 */
		trainBatch: function(dataset) {
			temp.open({prefix:'svmperf',suffix:".learn"}, function(err, tempFile) {
				for (var i=0; i<dataset.length; ++i) { 
					if (i>0) fs.write("\n");
					fs.write(tempFile.fd, dataset[i].output>0? "1": "-1"); // in svm-perf, the output comes first:
					fs.write(tempFile.fd, featureArrayToFeatureString(dataset[i].input));
				};
				
				fs.close(tempFile.fd, function(err) {
					this.modelFile = tempFile.path+".model";
					exec("svm_perf_learn "+this.learn_args+" "+tempFile.path + " "+this.modelFile);
				});
			});
		},
		
		

		/**
		 * @param inputs - a feature-value hash.
		 * @param explain - int - if positive, an "explanation" field, with the given length, will be added to the result.  
		 * @return the binary classification - 0 or 1.
		 */
		classify: function(features, explain) {
			temp.open({prefix:'svmperf',suffix:".classify"}, function(err, tempFile) {
				fs.write(tempFile.fd, "0");
				fs.write(tempFile.fd, featureArrayToFeatureString(features));
				
				fs.close(tempFile.fd, function(err) {
					exec("svm_perf_classify "+this.classify_args+" "+tempFile.path + " "+this.modelFile);
				});
			});
		},
};


/*
 * UTILS
 */

/**
 * convert an array of features to a single line in SVM-perf format. The line starts with a space.
 */
function featureArrayToFeatureString(features) {
	var line = "";
	for (var feature=0; feature<datum.input.length; ++feature) {
		var value = datum.input[feature];
		if (value)
			line += (" "+feature+":"+value);
	}
	return line;
}

module.exports = SvmPerf;

