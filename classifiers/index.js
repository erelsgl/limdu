module.exports = {
	// basic classifiers:
	NeuralNetwork: require('./brain/lib/neuralnetwork').NeuralNetwork,
	Bayesian: require('./bayesian/lib/bayesian').Bayesian,
	SVM: require('./svmjs/lib/svm').SVM,
	BayesClassifier: require('./apparatus/lib/apparatus/classifier/bayes_classifier'),
	LogisticRegressionClassifier: require('./apparatus/lib/apparatus/classifier/logistic_regression_classifier'),
	Perceptron: require('./perceptron/perceptron_hash'),
	Winnow: require('./winnow/winnow_hash'),
	
	// meta classifiers:
	BinaryClassifierSet: require('./BinaryClassifierSet'),
	EnhancedClassifier: require('./EnhancedClassifier'),
}

// add a "classify and log" method to all classifiers, for demos:
for (var classifierClass in module.exports) {
	module.exports[classifierClass].prototype.classifyAndLog = function(sample) {
		console.log(sample+" is "+this.classify(sample));
	}
}
