module.exports = {
	// basic classifiers:
	NeuralNetwork: require('./brain/lib/neuralnetwork').NeuralNetwork,
	Bayesian: require('./bayesian/bayesian'),
	SVM: require('./svmjs/lib/svm').SVM,
	SvmPerf: require('./svm/SvmPerf'),
	//BayesClassifier: require('./apparatus/lib/apparatus/classifier/bayes_classifier'),
	//LogisticRegressionClassifier: require('./apparatus/lib/apparatus/classifier/logistic_regression_classifier'),
	Perceptron: require('./perceptron/PerceptronHash'),
	Winnow: require('./winnow/WinnowHash'),

	multilabel: require('./multilabel'),
	
	// meta classifier:
	EnhancedClassifier: require('./EnhancedClassifier'),
}

module.exports.BinaryClassifierSet = module.exports.multilabel.BinaryRelevance; // for backward compatibility

// add a "classify and log" method to all classifiers, for demos:
for (var classifierClass in module.exports) {
	if (module.exports[classifierClass].prototype && module.exports[classifierClass].prototype.classify)
		module.exports[classifierClass].prototype.classifyAndLog = function(sample) {
			console.log(sample+" is "+this.classify(sample));
		}
}
