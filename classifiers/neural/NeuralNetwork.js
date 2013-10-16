/**
 * A wrapper for Heather Arthur's brain.js package: https://github.com/harthur/brain
 *
 * @author Erel Segal-haLevi
 * @since 2013-09-29
 */

var NeuralNetwork = require('brain').NeuralNetwork;

NeuralNetwork.prototype.trainOnline = function () {throw new Error("NeuralNetwork does not support online training");}; 
NeuralNetwork.prototype.trainBatch  = function(dataset) {
	dataset.forEach(function(datum) {
		if (!Array.isArray(datum.output) && !(datum.output instanceof Object))
			datum.output = [datum.output];
	});
	this.train(dataset); 
};
NeuralNetwork.prototype.classify  = NeuralNetwork.prototype.run; 

module.exports = NeuralNetwork;
