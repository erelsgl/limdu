module.exports = {
	// basic classifiers:
	NeuralNetwork: require('./brain/lib/neuralnetwork').NeuralNetwork,
	Bayesian: require('./bayesian/lib/bayesian').Bayesian,
	SVM: require('./svmjs/lib/svm').SVM,
	BayesClassifier: require('./apparatus/lib/apparatus/classifier/bayes_classifier'),
	LogisticRegressionClassifier: require('./apparatus/lib/apparatus/classifier/logistic_regression_classifier'),
	Perceptron: require('./perceptron/perceptron_hash'),
	MultiLabelPassiveAggressive: require('./perceptron/MultiLabelPassiveAggressiveHash'), // for backward compatibility
	Winnow: require('./winnow/winnow_hash'),
	
	// meta classifiers:
	BinaryClassifierSet: require('./BinaryClassifierSet'),  // for backward compatibility
	EnhancedClassifier: require('./EnhancedClassifier'),
	
	multilabel: {
		BinaryRelevance:   require('./BinaryClassifierSet'),
		PassiveAggressive: require('./perceptron/MultiLabelPassiveAggressiveHash'),
	}
}

// add a "classify and log" method to all classifiers, for demos:
for (var classifierClass in module.exports) {
	if (module.exports[classifierClass].prototype && module.exports[classifierClass].prototype.classify)
		module.exports[classifierClass].prototype.classifyAndLog = function(sample) {
			console.log(sample+" is "+this.classify(sample));
		}
}
