// simple demonstration of SVM

var SvmPerf = require('./SvmPerf');

// Train with two arrays - samples and labels: 
var traindata = [[0,0], [0,1], [1,0], [1,1]];
var labels = [-1, -1, 1, 1];

var svm = new svmjs.SVM();
svm.train(traindata, labels, {C: 1.0}); // C is a parameter to SVM
var testdata = [[0,2], [0,3], [1,2], [1,3]];
var testlabels = svm.predict(testdata);  // [ -1, -1, 1, 1 ]
console.dir(testlabels);

//Train with a single array: 
var traindata = [
     {input: [0,0], output: -1},
     {input: [0,1], output: -1}, 
     {input: [1,0], output: 1}, 
   	 {input: [1,1], output: 1},
     ];
var labels = [-1, -1, 1, 1];
var svm = new svmjs.SVM();
svm.trainBatch(traindata, {C: 1.0}); // C is a parameter to SVM
console.dir(svm.classify([0,2]));  // -1
console.dir(svm.classify([1,3]));  // 1
