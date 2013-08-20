module.exports = {
	BinaryRelevance:   require('./BinaryRelevance'),
	PassiveAggressive: require('./PassiveAggressiveHash'),
	//TransformationBased: require('./TransformationBased'),
}

// add a "classify and log" method to all classifiers, for demos:
for (var classifierClass in module.exports) {
	if (module.exports[classifierClass].prototype && module.exports[classifierClass].prototype.classify)
		module.exports[classifierClass].prototype.classifyAndLog = function(sample) {
			console.log(sample+" is "+this.classify(sample));
		}
}
