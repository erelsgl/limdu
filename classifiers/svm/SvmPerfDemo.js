// simple demonstration of SVM

var SvmPerf = require('./SvmPerf');

var execSync = require('execSync').run

var trainSet = [
		{input: [0,0], output: 0},
		{input: [1,1], output: 0},
		{input: [0,1], output: 1},
		{input: [1,2], output: 1} ];

var svm = new SvmPerf(
	{
		learn_args: "-c 20.0", 
		classify_args: "", 
		model_file_prefix: "demofiles/SvmPerfDemo",
		continuous_output:false}
);
svm.trainBatch(trainSet);

console.log(svm.classify([0,2]));  // 1
console.dir(svm.classify([1,0]));  // 0
