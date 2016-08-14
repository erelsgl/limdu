/**
 * A wrapper for Synaptic: https://github.com/cazala/synaptic
 *
 * Author: Inder
 */

var Synaptic = require('synaptic');
var Neuron = Synaptic.Neuron;
var Layer = Synaptic.Layer;
var Network = Synaptic.Network;
var Trainer = Synaptic.Trainer;
var Architect = Synaptic.Architect;

var Wrapper = function(Options)
{
   Options = Options || {};

   this.Inputs = Options.Inputs || 2;
   this.Hidden = Options.Hidden || 2;
   this.Output = Options.Output || 1;

   this.Rate = Options.Rate || .1;
   this.Iterations = Options.Iterations || 20000;
   this.Error = Options.Error || .005;
   this.Shuffle = Options.Shuffle || true;
   this.Log = Options.Log || 1000;
   this.Cost = Options.Cost || Trainer.cost.CROSS_ENTROPY;
 }

Wrapper.prototype.trainOnline = function () { throw new Error("Synaptic does not support online training YET"); };

Wrapper.prototype.trainBatch  = function(DataSet)
{
      this.DataSet = DataSet
      this.Network = new Architect.Perceptron(this.Inputs, this.Hidden, this.Output)
      this.Learn = new Trainer(this.Network)

	this.Learn.train(this.DataSet,
      {
            rate: this.Rate,
            iterations: this.Iterations,
            error: this.Error,
            shuffle: this.Shuffle,
            log: this.Log,
            cost: this.Cost
      });
};

Wrapper.prototype.classify  = function(DataSet)
{
      return this.Network.activate(DataSet);
};

module.exports = Wrapper;
