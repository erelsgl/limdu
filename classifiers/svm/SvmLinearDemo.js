// simple demonstration of binary SVM, based on LibLinear

var SvmLinear = require('./SvmLinear');
var partitions = require(__dirname+'/../../utils/partitions');

var dataset = [
		{input: [0,0], output: 0},
		{input: [1,1], output: 0},
		{input: [0,1], output: 1},
		{input: [1,2], output: 1} ];

// the separating line goes through [0,0.5] and [1,1.5]. It is:
//       0.5+x-y = 0
// or:   -1-2x+2y = 0

var classifier = new SvmLinear(
	{
		learn_args: "-c 20", 
		model_file_prefix: "tempfiles/SvmLinearDemo",
		train_command: "liblinear_train",
		test_command: "liblinear_test",
	        multiclass: false
	}
);
classifier.trainBatch(dataset);

console.log("simple classification: ");
console.dir(classifier.classify([0,2]));  // 1
console.dir(classifier.classify([1,0]));  // 0

console.log("model: ");
console.dir(classifier.mapLabelToMapFeatureToWeight);   // { '0': -1, '1': -2, '2': 2 }

partitions.partitions(dataset.concat(dataset), 2, function(train, test, index) {

	console.log("fold: "+index)
	classifier.trainBatch(train)
		
	test.forEach(function(instance) {
		console.dir("Classify instance:")
		console.dir(instance)
		console.dir(classifier.classify(instance.input));
	});
});