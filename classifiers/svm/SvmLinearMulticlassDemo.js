// simple demonstration of multiclass SVM, based on LibLinear

var SvmLinear = require('./SvmLinear');

var trainSet = [
		{input: [0,0], output: 3},
		{input: [1,1], output: 3},
		
		{input: [0,1], output: 4},
		{input: [1,2], output: 4},
		
		{input: [0,2], output: 5},
		{input: [1,3], output: 5},
		];

// One separating line goes through [0,0.5] and [1,1.5]. It is:
//        0.5+x-y = 0
// or:   -1-2x+2y = 0

//Another separating line goes through [0,1.5] and [1,2.5]. It is:
//       1.5+x-y = 0
//or:   -3-2x+2y = 0


var classifier = new SvmLinear(
	{
		learn_args: "-c 20", 
		model_file_prefix: "tempfiles/SvmLinearMulticlassDemo",
		multiclass: true,
		debug: false
	}
);
classifier.trainBatch(trainSet);

console.log("simple classification: ");
console.dir(classifier.classify([1,0]));  // 3
console.dir(classifier.classify([0,1.3]));  // 4
console.dir(classifier.classify([0,1.7]));  // 5
console.dir(classifier.classify([0,3]));  // 5

console.log("model: ");
console.dir(classifier.mapLabelToMapFeatureToWeight);   // { '0': -1, '1': -2, '2': 2 }

console.log("explained classification: ");
console.dir(classifier.classify([1,0],3));  // 3
console.dir(classifier.classify([0,1.3],3));  // 4
console.dir(classifier.classify([0,1.7],3));  // 5
console.dir(classifier.classify([0,3],3));  // 5

console.log("classification with scores: ");
console.dir(classifier.classify([1,0],0,true));  // 3
console.dir(classifier.classify([0,1.3],0,true));  // 4
console.dir(classifier.classify([0,1.7],0,true));  // 5
console.dir(classifier.classify([0,3],0,true));  // 5

console.log("explained classification with scores: ");
console.dir(classifier.classify([1,0],3,true));  // 3
console.dir(classifier.classify([0,1.3],3,true));  // 4
console.dir(classifier.classify([0,1.7],3,true));  // 5
console.dir(classifier.classify([0,3],3,true));  // 5
