/*
	Draw learning curves of classifiers
	A "learning curve" is a graph of the performance of a certain classifier, as a function of the number of training instances.
	You can draw learning curves of several classifiers on the same graph, for the sake of comparison.
	You can measure the performance can using several parameters, such as: accuracy, F1, etc.
	The graphs are drawn by "gnuplot", so you must have gnuplot installed in order to use this unit.
	@author Vasily Konovalov
 */

var _ = require('underscore')._;
var fs = require('fs');
var execSync = require('execSync')
var partitions = require('./partitions');
var trainAndTest_hash = require('./trainAndTest').trainAndTest_hash;

/* @params classifiers - classifier for learning curves
   @params dataset - dataset for evaluation, 20% is takes for evaluation
   @params parameters - parameters we are interested in 
   @params step - step to increase a train set 

   The example of the input is following.

classifiers  = {
	Adaboost: limdu.classifiers.multilabel.Adaboost, 
	PassiveAggressive: limdu.classifiers.multilabel.PassiveAggressive
	};

parameters = ['F1','TP','FP','FN','Accuracy','Precision','Recall']
*/

module.exports.stringifyClass = function (aClass) {
	return (_(aClass).isString()? aClass: JSON.stringify(aClass));
}

module.exports.learning_curves = function(classifiers, dataset, parameters, step, numOfFolds) {

	dir = "./learning_curves/"

	var result = execSync.run("gnuplot -V");
	if (result !=0 ) {
		console.log("gnuplot is not found")
		return 0
	}

	plotfor = "plot "
	_(numOfFolds).times(function(n){
		header = "train\t" + (Object.keys(classifiers)).join(+"-fold"+n+"\t")+"-fold"+n+"\n";
	_.each(parameters,  function(value, key, list){ 
		plotfor = plotfor + " for [i=2:"+ (_.size(classifiers) + 1)+"] \'"+dir+value+"-fold"+n+"\' using 1:i with lines linecolor i, "
		fs.writeFileSync(dir+value+"-fold"+n, header, 'utf-8', function(err) {console.log("error "+err); return 0 })
		},this)
	},this)

	plotfor = plotfor.substring(0,plotfor.length-2);

	partitions.partitions(dataset, numOfFolds, function(train, test, fold) {
		index = step		

		while (index < train.length)
  		{

  		report = []
	  	mytrain = train.slice(0, index)
	  	index += step

	    _.each(classifiers, function(value, key, list) { 	
	    	stats = trainAndTest_hash(value, mytrain, test, 0)
	    	report.push(stats[0]['stats'])
	    })
		
		_.each(parameters, function(value, key, list){
			valuestring = mytrain.length +"\t"+ (_.pluck(report, value)).join("\t") +"\n" ;
			fs.appendFileSync(dir+value+"-fold"+fold, valuestring,'utf8', function (err) {console.log("error "+err); return 0 })
		},this)

		_.each(parameters, function(value, key, list){
			command = "gnuplot -p -e \"reset; set term png truecolor; set grid ytics; set grid xtics; set key bottom right; set output \'"+dir + value+".png\'; set key autotitle columnhead; "+plotfor +"\""
			result = execSync.run(command)
		}, this)
		}

		});

}