module.exports = {
	hash: require("./hash"),
	partitions: require("./partitions"),
	PrecisionRecall: require("./PrecisionRecall"),
	serialize: require("./serialize"),
	testLite: require("./trainAndTest").testLite,
	test: require("./trainAndTest").test,
	compare: require("./trainAndTest").compare,
	trainAndTest: require("./trainAndTest").trainAndTest,
	trainAndCompare: require("./trainAndTest").trainAndCompare,
	writeDataset: require("./trainAndTest").writeDataset,
	toARFF: require("./arff").toARFF,
	toARFFs: require("./arff").toARFFs,
	hammingDistance: require("./hamming").hammingDistance,
}

