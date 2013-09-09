// simple demonstration of SVM

var SvmJs = require('./SvmJs');

var svm = new SvmJs({C: 1.0});

var traindata = [
     {input: [0,0], output: 0},
     {input: [0,1], output: 0}, 
     {input: [1,0], output: 1}, 
   	 {input: [1,1], output: 1},
     ];

svm.trainBatch(traindata);

console.dir(svm.classify([0,2]));  // 0
console.dir(svm.classify([1,3]));  // 1

// explain:
console.dir(svm.classify([0,2], 3));  // 0
console.dir(svm.classify([1,3], 3));  // 1


//continuous output:
console.dir(svm.classify([0,2], 0, true));  // -1
console.dir(svm.classify([1,3], 0, true));  // 1
