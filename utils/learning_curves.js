/**
 * Draw a learning curves
 * 
 * @author Vasily Konovalov
 */

var _ = require('underscore')._;
var fs = require('fs');
var execSync = require('execSync')
var partitions = require('./partitions');
var trainAndTest = require('./trainAndTest').trainAndTest;

/* @params classifiers - classifier for learning curves
   @params dataset - dataset for evaluation, 20% is takes for evaluation
   @params parameters - parameters we are interested in 
   @params step - step to increase a train set 

   The example of the input is following.

classifiers  = {
	HomerWinnow: classifier.HomerWinnow, 
	Adaboost: classifier.AdaboostClassifier, 
	Winnow: classifier.WinnowClassifier };

parameters = ['F1','TP','FP','FN','Accuracy','Precision','Recall']
*/
module.exports.learning_curves = function(classifiers, dataset, parameters, step) {

	dir = "./learning_curves"

	var result = execSync.run("gnuplot -V");
	if (result !=0 ) {
		console.log("gnuplot is not found")
		return 0
	}

	try { content = fs.readdirSync(dir) }

	catch (e)
		{	fs.mkdirSync(dir);
			content = fs.readdirSync(dir)				
		}
	
		if (content.length !=0)
		{
			console.log("The existing report is found. If you want to draw a learning curves, remove the existing report")
			_.each(content, function(value, key, list) {
				value = "./learning_curves/"+value
				command = "gnuplot -p -e \"set key autotitle columnhead; set title \'"+value+"\'; plot for [i=2:20] \'"+value+"\' using 1:i with lines\""
				result = execSync.run(command)
	    	})
	  		return 0
		}
		
	dataset = _.shuffle(dataset)

	dataset = partitions.partition(dataset, 1, Math.round(dataset.length*0.2))
	train = dataset['train']
	test = dataset['test']	

	index = step
		
	header = "train\t" + (Object.keys(classifiers)).join("\t")+"\n";

	_.each(parameters,  function(value, key, list){ 
		fs.writeFileSync("./learning_curves/"+value, header, 'utf-8', function(err) {console.log("error "+err); return 0 })
	})

	while (index < train.length)
  	{
  		report = []
	  	mytrain = train.slice(0, index)
	  	index += step
	  	
	    _.each(classifiers, function(value, key, list) {
	    	report.push(trainAndTest(value, mytrain, test).fullStats())
	    })
		
		_.each(parameters, function(value, key, list){
			valuestring = mytrain.length +"\t"+ (_.pluck(report, value)).join("\t") +"\n" ;
			fs.appendFileSync("learning_curves/"+value, valuestring,'utf8', function (err) {console.log("error "+err); return 0 })
		})
	}
}

// command = "gnuplot -p -e \"set key autotitle columnhead; set title \'"+value+"\'; plot \'"+value+"\' using 1:2  with lines, \'"+value+"\' using 1:3 with lines, \'"+value+"\' using 1:4 with lines\""
// plot for [i=2:10] "Accuracy" using 1:i with lines
