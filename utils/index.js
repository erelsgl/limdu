module.exports = {
	hash: require("./hash"),
	partitions: require("./partitions"),
	PrecisionRecall: require("./PrecisionRecall"),
	serialize: require("./serialize"),
	trainAndTest: require("./trainAndTest").trainAndTest,
	test: require("./trainAndTest").test,
	testLite: require("./trainAndTest").testLite,
	writeDataset: require("./trainAndTest").writeDataset,
	toARFF: require("./arff").toARFF,
	toARFFs: require("./arff").toARFFs,
	hammingDistance: require("./hamming").hammingDistance,
}

