module.exports = {
	BinaryRelevance:        require('./BinaryRelevance'),
	PassiveAggressive:      require('./PassiveAggressiveHash'),
	BinarySegmentation:     require('./BinarySegmentation'),
	MulticlassSegmentation: require('./MulticlassSegmentation'),
	Homer:                  require('./Homer'),
	MetaLabeler:            require('./MetaLabeler'),
	CrossLanguageModel:     require('./CrossLangaugeModelClassifier'),
}

// add a "classify and log" method to all classifiers, for demos:
for (var classifierClass in module.exports) {
	if (module.exports[classifierClass].prototype && module.exports[classifierClass].prototype.classify)
		module.exports[classifierClass].prototype.classifyAndLog = function(sample) {
			console.log(sample+" is "+this.classify(sample));
		}
}
