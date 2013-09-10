// simple demonstration of SVM

var SvmPerf = require('./SvmPerf');
var execSync = require('execSync').run

var trainSet = [
		{input: [0,0], output: 0},
		{input: [1,1], output: 0},
		{input: [0,1], output: 1},
		{input: [1,2], output: 1} ];

// the separating line goes through [0,0.5] and [1,1.5]. It is:
//       0.5+x-y = 0
// or:   2y-2x-1 = 0


var svm = new SvmPerf(
	{
		learn_args: "-c 20.0", 
		model_file_prefix: "tempfiles/SvmPerfDemo",
		debug:false
	}
);
svm.trainBatch(trainSet);

// binary output:
console.dir(svm.classify([0,2]));  // 1
console.dir(svm.classify([1,0]));  // 0

console.dir(svm.modelMap);   // { '0': -1, '1': -2, '2': 2 }

// explain:
console.dir(svm.classify([0,2], 3));  // 1
console.dir(svm.classify([1,0], 3));  // 0

// continuous output:
console.dir(svm.classify([0,2], 0, true));  // 3
console.dir(svm.classify([1,0], 0, true));  // -3
