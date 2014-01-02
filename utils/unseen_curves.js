/*
	Draw curves of unseen words.

	This module draw a curve of the ratio of the unseen words to the size of the dataset.
	@params dataset - dataset

	The size of seen vocabulary is iteratively increased by the sentence from the dataset. 
	On every sentence the ratio of unseen words in the seen vocabulary is calculated.

	gnuplot has to be installed
	http://www.gnuplot.info/

	@author Vasily Konovalov
 */

var _ = require('underscore')._;
var fs = require('fs');
var execSync = require('execSync')
var partitions = require('./partitions');
var trainAndTest = require('./trainAndTest').trainAndTest;
var natural = require('natural');

var tokenizer = new natural.WordPunctTokenizer();

function normalizer(sentence) {
	if (typeof sentence == 'undefined')
		{return ""}
	else
		{
		return sentence.toLowerCase().trim();
		}
}

function tokenizedataset(dataset)
{ 
	vocabulary = []
	for (var sample in dataset) 
    {
    		if (dataset[sample].length!=0)
    	   	{
    	   	var words = tokenizer.tokenize(normalizer(dataset[sample]['input']));
	    	vocabulary = vocabulary.concat(words);
	    	}
	 }
    return _.uniq(vocabulary);
}

/*
	@params dataset - dataset.
	The plot files is stored in the directory unseen_words_curve.
	If the plot file is in the directory the new plot will not be constructed, 
	instead the plot file will be opened by gnuplot.

	In order to build new plot file, delete the existing one.
*/

module.exports.unseen_word_curves = function(dataset) {

	dir = "./unseen_words_curve/"

	try { content = fs.readdirSync(dir) }

	catch (e)
		{	fs.mkdirSync(dir);
			content = fs.readdirSync(dir)				
		}

		if (content.length !=0)
		{
			console.log("The existing report is found. If you want to draw a learning curves, remove the existing report")
			command = "gnuplot -p -e \"plot \'"+dir+"unseen_curves\' using 1:2 with lines\""
			result = execSync.run(command)
	    	return 0
		}

	var result = execSync.run("gnuplot -V");
	if (result !=0 ) {
		console.log("gnuplot is not found")
		return 0
	}
		seen_vocabulary = []
		
		total_vocabulary = tokenizedataset(dataset)

	_.each(dataset,  function(sentence, key, list){ 
		seen_vocabulary = _.uniq(seen_vocabulary.concat(tokenizedataset([sentence])))
		unseen_word = _.difference(total_vocabulary, seen_vocabulary)
		unseen_word_ratio = unseen_word.length/total_vocabulary.length
		fs.appendFileSync(dir+"unseen_curves", seen_vocabulary.length+"\t"+unseen_word_ratio+"\n",'utf8', function (err) {console.log("error "+err); return 0 })
	})
}