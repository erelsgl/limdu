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
