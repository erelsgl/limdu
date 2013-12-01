console.log("Decision Tree demo start");
var DecisionTree = require('./DecisionTree');

var classifier = new DecisionTree({
});

dataset = [{input: {a:1 , b:0  }, output: 0},
		   {input: {a:0 , b:1  }, output: 0},
		   {input: {a:0 , b:0  }, output: 1}]

classifier.trainBatch(dataset);

console.dir(classifier.classify({'a': 0, 'b': 0}, /*explain=*/1));
console.dir(classifier.classify({'a': 1, 'b': 1}, /*explain=*/3));

console.log("Decision Tree demo end");
