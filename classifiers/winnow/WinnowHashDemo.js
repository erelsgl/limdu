/**
 * Demonstrates the winnow classification algorithm.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-07
 */

console.log("Winnow demo start");
var Winnow = require('./WinnowHash');

var classifier = new Winnow({
	default_positive_weight: 1,
	default_negative_weight: 1,
	threshold: 0,
	do_averaging: false,
	margin: 1,
});

classifier.trainOnline({'a': 1, 'b': 0}, 0);
classifier.trainOnline({'a': 0, 'b': 1}, 0);
classifier.trainOnline({'a': 0, 'b': 0}, 1);

console.dir(classifier.classify({'a': 0, 'b': 0}, /*explain=*/1));
console.dir(classifier.classify({'a': 1, 'b': 1}, /*explain=*/3));

console.log("Winnow demo end");
