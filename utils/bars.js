/*
	This module was created as a utils for limdu, many of the routines were copied from train.js of nlu-server.
	The main function of the following methods is helping to represent the analysis of given data.
	This module contains: 
		* the hierarchical representation of the labels.
		* routines for aggregating statistics after cross - validation.
		* routine for building confusion matrix.
		* auxiliary routine for building table in html format.
		* routine for building intent attribute distribution.
		* etc.

	@author Vasily Konovalov
 */
var execSync = require('execSync')
var _ = require('underscore')._;
var fs = require('fs');
var multilabelutils = require('../classifiers/multilabel/multilabelutils');
var DefaultDict = require('defaultdict')


semlang = [ '{"Reject":"previous"}',
  '{"Append":"previous"}',
  '{"Offer":{"Leased Car":"With leased car"}}',
  '{"Reject":"Salary"}',
  '{"Offer":{"Working Hours":"9 hours"}}',
  '{"Insist":"Job Description"}',
  '{"Offer":{"Job Description":"Programmer"}}',
  '{"Offer":{"Working Hours":"10 hours"}}',
  '{"Reject":"Leased Car"}',
  '{"Offer":{"Leased Car":"No agreement"}}',
  '{"Offer":{"Leased Car":"Without leased car"}}',
  '{"Accept":"Salary"}',
  '{"Insist":"Working Hours"}',
  '{"Offer":{"Promotion Possibilities":"Slow promotion track"}}',
  '{"Accept":"previous"}',
  '{"Offer":{"Working Hours":"8 hours"}}',
  '{"Offer":{"Job Description":"Project Manager"}}',
  '{"Offer":{"Salary":"7,000 NIS"}}',
  '{"Offer":{"Pension Fund":"10%"}}',
  '{"Offer":{"Promotion Possibilities":"Fast promotion track"}}',
  '{"Offer":{"Salary":"12,000 NIS"}}',
  '{"Offer":{"Pension Fund":"0%"}}',
  '{"Offer":{"Job Description":"QA"}}',
  '{"Query":"accept"}',
  '{"Greet":true}',
  '{"Offer":{"Pension Fund":"20%"}}',
  '{"Offer":{"Job Description":"Team Manager"}}',
  '{"Quit":true}',
  '{"Query":"issues"}',
  '{"Query":"Salary"}',
  '{"Query":"compromise"}',
  '{"Query":"Job Description"}',
  '{"Reject":"Working Hours"}',
  '{"Accept":"Leased Car"}',
  '{"Accept":"Pension Fund"}',
  '{"Reject":"Pension Fund"}',
  '{"Insist":"previous"}',
  '{"Insist":"Salary"}',
  '{"Query":"Leased Car"}',
  '{"Reject":"Job Description"}',
  '{"Reject":"Promotion Possibilities"}',
  '{"Offer":{"Salary":"20,000 NIS"}}',
  '{"Accept":"Working Hours"}',
  '{"Accept":"Job Description"}',
  '{"Insist":"Promotion Possibilities"}',
  '{"Query":"Promotion Possibilities"}',
  // '{"Offer":{"Salary":"10,000 NIS"}}',
  '{"Query":"Working Hours"}',
  '{"Insist":"Pension Fund"}',
  '{"Query":"bid"}',
  '{"Accept":"Promotion Possibilities"}',
  '{"Query":"Pension Fund"}',
  '{"Offer":{"Pension Fund":"No agreement"}}',
  '{"Insist":"Leased Car"}' ]

labeltree = { Offer: 
   { Salary: { '12,000 NIS': {}, '7,000 NIS': {}, '20,000 NIS': {} },
     'Job Description': 
      { QA: {},
        'Team Manager': {},
        Programmer: {},
        'Project Manager': {} },
     'Pension Fund': { '10%': {}, '0%': {}, '20%': {}, 'No agreement': {} },
     'Working Hours': { '10 hours': {}, '9 hours': {}, '8 hours': {} },
     'Promotion Possibilities': { 'Fast promotion track': {}, 'Slow promotion track': {} },
     'Leased Car': 
      { 'Without leased car': {},
        'With leased car': {},
        'No agreement': {} } },
  Insist: 
   { 'Pension Fund': {},
     'Working Hours': {},
     previous: {},
     'Job Description': {},
     'Promotion Possibilities': {},
     Salary: {},
     'Leased Car': {} },
  Greet: { true: {} },
  Reject: 
   { Salary: {},
     'Leased Car': {},
     previous: {},
     'Pension Fund': {},
     'Job Description': {},
     'Working Hours': {},
     'Promotion Possibilities': {} },
  Accept: 
   { previous: {},
     Salary: {},
     'Pension Fund': {},
     'Working Hours': {},
     'Leased Car': {},
     'Job Description': {},
     'Promotion Possibilities': {} },
  Query: 
   { 'Job Description': {},
     accept: {},
     compromise: {},
     bid: {},
     'Working Hours': {},
     'Leased Car': {},
     'Pension Fund': {},
     Salary: {},
     issues: {},
     'Promotion Possibilities': {} },
  Append: { previous: {} },
  Quit: { true: {} } }




function convertlabeltree()
{
	labels = []
	_.each(labeltree, function(attval, intent, list){ 
		_.each(attval, function(value, attr, list){
			if (Object.keys(value).length != 0)
				{ 
				_.each(value, function(value1, key, list){ 
						labels.push([intent,attr,key])
				}, this)
				}
			else
				labels.push([intent,attr])
		},this)
	}, this)
	return labels
}


// module.exports.expl_struct = function(explanation)
function expl_struct(explanation)
{
	exp = []

	_.each(explanation, function(value, key, list){ 
		if (typeof(value)==="object")
			exp.push(value)
	}, this)


	list = []
	listpos = []

	list.push(_.pluck(exp, 'positive'))
	list.push(_.pluck(exp, 'negative'))

	// poslist = _.pluck(exp, 'positive')
	_.each(list, function(poslist, key, list){ 
		pos = {}

	// concat same labels 
	_.each(poslist, function(hashlab, key, list){
		_.each(hashlab, function(weightlist, lab, list){
			if (!(lab in pos))
				pos[lab] = []
			// pos[lab] = pos[lab].concat(weightlist)
			_.each(weightlist, function(wei, key, list){
				even = _.find(pos[lab], function(num){ return num[0] == wei[0]; });
				// console.log(even)
				// process.exit(0)
				if ((typeof(even)!="undefined"))
					{
					_.each(pos[lab], function(value5, key5, list){
						if (_.isEqual(value5,even))
							pos[lab][key5][1] =  pos[lab][key5][1] + wei[1]
					}, this)
					}
				else
					pos[lab].push(wei)
			}, this)
		 }, this) 
	}, this)

	listpos.push(pos)
}, this)



	hashpos = 
	{
		'positive': listpos[0],
		'negative': listpos[1]
	}
	// // merge same weight and aggreagde values
	// _.each(pos, function(weigths, lab, list){
	// 	_.each(weigths, function(wei, key, list){ 
	// 		_.each(weigths, function(wei1, key1, list){ 
	// 			if ((wei[0] == wei1[0])&& (key != key1))
	// 				pos[lab][key][1] = pos[lab][key][1] + pos[lab][key1][1]
	// 		}, this)
	// 	 }, this) 
	// }, this)

	// console.log(JSON.stringify(hashpos, null, 4))

	// console.log(JSON.stringify(ab, null, 4))

	// bc = _.extend(ab[0], ab[1])

	// console.log(JSON.stringify(bc, null, 4))
	// // console.log(exp)
	// process.exit(0)
	return hashpos
}

// module.exports.aggregate_results = function(stats)
function aggregate_results(stats)
{
	results = _.reduce(stats, function(memo, obj) {
	  return {
	    F1: memo.F1 + obj.F1,
	    Precision: memo.Precision + obj.Precision,
	    Recall: memo.Recall + obj.Recall,
	    Accuracy: memo.Accuracy + obj.Accuracy,
	  };
	}, {F1: 0, Precision: 0, Recall: 0, Accuracy: 0})

	_.each(results, function(value, key, list){ 
		results[key] = value/stats.length
		}, this)
	return results
}

function find_path(mat)
{
	var d = []
	d[mat.length - 1] = 0//mat[mat.length -2][mat.length-1]
	d[mat.length - 2] = mat[mat.length -2][mat.length-1]
	// console.log(mat.length - 3)
	// console.log(_.range(mat.length - 3, -1, -1))
	_.each(_.range(mat.length - 3, -1, -1), function(value1, key, list){ 
	// }, this)
	// _(mat.length - 2).times(function(n){
		var buf = []
		// _.each(mat, function(value, key, list){ 
		// }, this)
		// _(n).times(function(nn){
			// if ()/
		// })
		// console.log("value1"+value1)
		_.each(_.range(value1+1, mat.length, 1), function(value, key, list){ 
			// console.log("value"+value)
			// console.log("mat"+mat[value1][value])
			// if ((mat[value1][value]!=0)&&(mat[value1][value]!=Infinity))
			if ((mat[value1][value]!=Infinity))
				buf.push(mat[value1][value]+d[value])
		}, this)
		// console.log("123")
		// console.log(buf)
		// process.exit(0)
		d[value1] = _.max(buf, function(i){ return i });

	}) 

	console.log(d)
	
	var v = 0
	var path = [v]
	while (d[v] != 0)
   	{
   		// for each edge (v,u):
   		lo=true
   		_.each(_.range(v+1, mat.length,1), function(u, key, list){ 
   			if (lo)
   			{
   			console.log("d[v]="+d[v])
   			console.log("mat[v][u]="+mat[v][u])
   			console.log("d[u]="+d[u])
        	}
        	if ((d[v] - mat[v][u] == d[u])&&(lo))
            	{
            	path.push(u)
				console.log("u"+u)
				console.log(path)
            	// console.log(v)
            	// process.exit(0)
            	v = u
            	lo=false
             // break
             	}
   		}, this)

    }
	// return list

	console.log(path)
	return d
}

function aggreate_similar(list)
{
	buf = []
	str = ""
	clean = []
	_.each(list, function(value, key, list){ 
		if ((value[0]=='Offer')&&((buf.length==0)||(buf[buf.length-1][2][1] == value[2][0])))
			{
				buf.push(value)
				str = str + value[1]
			}
		else
			{
				if (buf.length!=0) 
					clean.push(['Offer',str,[buf[0][2][0], buf[buf.length-1][2][1]]])
				buf = []
				str = ""
				clean.push(value)
			}

	}, this)
	if (buf.length!=0)
		clean.push(['Offer',str,[buf[0][2][0], buf[buf.length-1][2][1]]])
	return clean
}

function aggregate_sagae(classes, classifier, parts, explanations, original)
{
	// console.log("inside")
	
	// process.exit(0)

	var clas = []

	explanations[0] = aggreate_similar(explanations[0])

	console.log(JSON.stringify(explanations, null, 4))
	console.log(parts)

	_.each(explanations[0], function(intent, key, list){ 
		
		_.each(explanations[2], function(value, key, list){ 
			if ((intent[2][0]-1<=value[2][0])&&(intent[2][1]+1>=value[2][1]))
			// if ((intent[2][0]<=value[2][0])&&(intent[2][1]>=value[2][1]))
				{
				clas.push([[intent[0]],[], [value[0]]])
				}
		}, this)

		_.each(explanations[1], function(attr, key, list){ 
			if ((intent[2][0]-1<=attr[2][0])&&(intent[2][1]+1>=attr[2][1]))
			// if ((intent[2][0]<=attr[2][0])&&(intent[2][1]>=attr[2][1]))
				clas.push([[intent[0]],[attr[0]], []])

			_.each(explanations[2], function(value, key, list){ 
				if ((attr[2][0]-1<=value[2][0])&&(attr[2][1]+1>=value[2][1])&&
					(intent[2][0]-1<=attr[2][0])&&(intent[2][1]+1>=attr[2][1]))
				// if ((attr[2][0]<=value[2][0])&&(attr[2][1]>=value[2][1])&&
					// (intent[2][0]<=attr[2][0])&&(intent[2][1]>=attr[2][1]))
					clas.push([[intent[0]],[attr[0]], [value[0]]])
			}, this)
		}, this)
				
	}, this)
	
	// console.log(clas)
	// process.exit(0)

	js = []
	_.each(clas, function(lab, key, list){ 
		js = js.concat(generate_possible_labels(resolve_emptiness(lab)))
				
	}, this)

	// console.log(parts)
	console.log(_.uniq(js))
	console.log(original)
	console.log("------------------------------")
	// console.log(original)
	// process.exit(0)

	return _.uniq(js)

}

function aggregate_lab(explanations, inputngram, inputnorm)
// function exports.aggregate_lab = function(explanations, inputngram, inputnorm)
{

	tags = convertlabeltree()

	senlabel =  {}
	_.each(explanations['positive'], function(value, label, list){
		// _.each(sample.replace(/\,/g,"").split(" "), function(value1, key, list){ 
		_.each(inputngram, function(value1, feature, list){ 
			var element = _.find(value, function(num){ return num[0]==feature; });
			if (element)
				{
				if (!(label in senlabel))
					senlabel[label] =  new DefaultDict(0);

				senlabel[label].set(feature, senlabel[label].get(feature) + element[1])
				}
		}, this)
	}, this)

	pop = []

	//treating bigrams
	_.each(senlabel, function(setofgrams, label, list){ 
			_.each(setofgrams['_'], function(value, gram, list){ 
				if (gram.split(" ").length>1)
					_.each(gram.split(" "), function(unigram, key, list){
						senlabel[label]['_'][unigram] = senlabel[label]['_'][unigram]+value
					}, this)
			}, this)
		}, this)

	return senlabel

}

function aggregate_label_trick(classes, classifier, sample, explanations, original)
{
	draw = false
	return aggregate_label(classifier, sample, explanations, true, draw, original)
}


function aggregate_label_no_trick(classes, classifier, sample, explanations, original)
{
	draw = false
	return aggregate_label(classifier, sample, explanations, false, draw, original)
}

// module.exports.aggregate_label = function(explanations, inputngram, inputnorm)
// module.exports.aggregate_label = function(classifier, sample, explanations)
function aggregate_label(classifier, sample, explanations, trick, draw, original)
// exports.aggregate_label = function(classifier, sample, explanations)
{
	var inputngram = classifier.sampleToFeatures(classifier.normalizedSample(sample), classifier.featureExtractors)
	var inputnormal = classifier.normalizedSample(sample)
	
	inputnormal = inputnormal.replace(/\,/g," ,")
	inputnormal = inputnormal.replace(/\./g," .")
	inputnormal = inputnormal.replace(/\?/g," ?")
	inputnormal = inputnormal.replace(/\!/g," !")
	inputnormal = inputnormal.replace(/\%/g," %")
	inputnormal = inputnormal.replace(/\$/g," $")

	// console.log(_.extend(explanations['positive'],explanations['negative']))
	// process.exit(0)

	var senlabel =  {}
	_.each(explanations['positive'], function(value, label, list){
	// _.each(_.extend(explanations['positive'],explanations['negative']), function(value, label, list){
		// _.each(sample.replace(/\,/g,"").split(" "), function(value1, key, list){ 
		_.each(inputngram, function(value1, feature, list){ 
			var element = _.find(value, function(num){ return num[0]==feature; });
			if (element)
				{
				if (!(label in senlabel))
					senlabel[label] =  new DefaultDict(0);

				senlabel[label].set(feature, senlabel[label].get(feature) + element[1])
				}
		}, this)
	}, this)

	var pop = []

	//treating bigrams
	_.each(senlabel, function(setofgrams, label, list){ 
			_.each(setofgrams['_'], function(value, gram, list){ 
				if (gram.split(" ").length>1)
					_.each(gram.split(" "), function(unigram, key, list){
						senlabel[label]['_'][unigram] = senlabel[label]['_'][unigram]+value
					}, this)
			}, this)
		}, this)

	var wordhash = {}

	_.each(senlabel, function(words, label, list){ 
		_.each(words['_'], function(value, word, list){
			if (!(word in wordhash))
				wordhash[word] = []//new DefaultDict(0)
			wordhash[word].push([label, value])
		}, this)
	}, this)

	//sorting 
	// console.log(senlabel)

	// console.log(wordhash)
	// process.exit(0)

	if (draw)
		{
			senid = "./image/"+Date.now()
			var labellist = Object.keys(senlabel)
			_.each(labellist, function(value, key, list){ 
				labellist[key] = "\""+value+"\""
			}, this)

			// fs.writeFileSync(senid, "word\tword\t"+labellist.join("\t") + "\n", 'utf-8', function(err) {console.log("error "+err); return 0 })
			fs.writeFileSync(senid, "word\tword\t"+labellist.join("\t") + "\n", 'utf-8')

			_.each(inputnormal.split(" "), function(word, wordnum, list){
			var row = []
				_.each(wordhash[word], function(value, key, list){
					row.push(value[1])
				 }, this) 
			fs.appendFileSync(senid, wordnum+"\t"+word+"\t"+row.join("\t")+"\n",'utf8')
			}, this)

		command = "gnuplot -p -e \"reset; set term png truecolor  size 1000,1000; set grid ytics; set grid xtics; set title \'"+sample.replace(/\'/g,'')+"\';  set key top right; set output \'image/"+sample.replace(/\'/g,'')+".png\'; set key autotitle columnhead; set label \'"+(JSON.stringify(original)).replace(/[\",\\]/g,"")+"\' at screen 0.1, 0.9; plot for [i=3:"+(labellist.length+2)+"] \'"+senid+"\' using 1:i:xticlabels(2) smooth frequency with boxes\""
		if (labellist.length > 0)
			result = execSync.run(command)
		}

	_.each(wordhash, function(value, key, list){ 
		wordhash[key] = (_.sortBy(value, function(num){ return num[1]; })).reverse();
	}, this)

	var pop = []
	var buffer = []

	// console.log(wordhash)
	// process.exit(0)
	
	_.each(wordhash, function(labels, word, list){
		if (word.split(" ").length==1)
			{
			// console.log(word)
			var ar = []
			_.each(labels, function(value, key, list){ 
				if (value[1]>0)
					ar.push((value[0]=="true") ? true:value[0])
			}, this)

			// console.log("ar")
			// console.log(ar)
			comp = bag_of_labels_to_components(ar.concat(buffer))
			// console.log("comp")
			// console.log(comp)

			if (trick) comp = resolve_emptiness(comp)
			var label = generate_possible_labels(comp)
			// console.log("label")
			// console.log(label)
			pop = pop.concat(label)

			} 
		buffer = _.clone(ar)
	}, this)

	return _.uniq(pop)
}

// input: [[],[],['20,000 NIS']]
// output: [['Offer'],['Salary'],['20,000 NIS']]
// module.exports.resolve_emptiness = function(label)
function resolve_emptiness(label)
{
	_.each(label[2], function(value, key, list){ 
		var amb = semlang_ambiguity([value])
		if (amb.length==1)
			{
				// label = this.join_labels(label,amb[0])
				label = join_labels(label,amb[0])
			}
	}, this)
	_(3).times(function(n){
		label[n] = _.uniq(label[n])
	})
	return label
}


// input: [['Offer', 'Accept'], ['Salary'], ['previous','20,000 NIS']]
// output: [{'Offer':{'Salary':'20,000 NIS'}}, {'Accept':'previous'}]
// module.exports.generate_possible_labels = function(label)
function generate_possible_labels(label)
{
	var out = []
	_.each(label[0], function(intent, key, list){
		_.each(label[2], function(value, key, list){
			_.each(semlang, function(semval, key, list){ 
				var lab = splitPartEqually(multilabelutils.normalizeOutputLabels(semval))
				if (_.isEqual([intent,value],_.flatten(lab)))
					out.push(semval)
			 }, this)
		 }, this) 
		_.each(label[1], function(value, key, list){
			_.each(semlang, function(semval, key, list){ 
				var lab = splitPartEqually(multilabelutils.normalizeOutputLabels(semval))
				if (_.isEqual([intent,value],_.flatten(lab)))
					out.push(semval)
			 }, this)
		 }, this) 
		_.each(label[1], function(attr, key, list){
			_.each(label[2], function(value1, key, list){ 
				_.each(semlang, function(semval, key, list){ 
					var lab = splitPartEqually(multilabelutils.normalizeOutputLabels(semval))
					if (_.isEqual([intent,attr,value1],_.flatten(lab)))
					out.push(semval)
				}, this)
			 }, this) 
		}, this)
	}, this)
	return out
}

function join_labels(label, label1)
// module.exports.join_labels = function(label, label1)
{
	_(3).times(function(n){
		label[n] = label[n].concat(label1[n])
	})
	return label
}
// module.exports.semlang_ambiguity = function(label)
function semlang_ambiguity(label)
{

	var out = []
	_.each(semlang, function(value, key, list){
		var lab = splitPartEqually(multilabelutils.normalizeOutputLabels(value))
		if (_.difference(label,_.flatten(lab)).length==0)
			out.push(_.flatten(lab))
	}, this)
	return out
}

// input : ['Offer', 'Salary', '20,000 NIS']
// output: [['Offer'],['Salary'], ['20,000 NIS']]
// exports.bag_of_labels_to_components = function(label)
function bag_of_labels_to_components(label)
{
	var set = [[],[],[]]
	_.each(semlang, function(value, key, list){
		var out = splitPartEqually(multilabelutils.normalizeOutputLabels(value))
		_.each(out, function(va, key, list){
			set[key] = set[key].concat(va) 
		}, this)
	}, this)

	_.each(set, function(value, key, list){ 
		set[key] = _.uniq(value)
	}, this)

	var out = [[],[],[]]

	_.each(label, function(val, key, list){ 
		// if (val.length != 0)
		// {
			if (set[0].indexOf(val)!=-1) out[0].push(val)
			if (set[1].indexOf(val)!=-1) out[1].push(val)
			if (set[2].indexOf(val)!=-1) out[2].push(val)
		// }
	}, this)

	return out
}

/*@input - array of hashes, as a input given after cross -  validation
@output - hash that aggregates all statistics from the input*/
function aggregate_two_nested(stats)
// module.exports.aggregate_two_nested = function(stats)
{
	b = _.reduce(stats, function(memo, obj) {
	h = _.clone(memo)

	_.each(obj, function(value, label, list){ 
		if (!(label in h ))
			h[label] = {}
		_.each(_.keys(value), function(param, key, list){ 
			if (param in h[label])
				h[label][param] = h[label][param] + obj[label][param]
			else
				h[label][param] = obj[label][param]
  		}, this)
	}, this)

	return h
	}, {}, this)

	_.each(b, function(value, key, list){ 
		_.each(value, function(value1, key1, list){ 
			b[key][key1] = value1/stats.length
		}, this)
	}, this)
	return b
}

/*@input - stats from test
@output - confusion matrix in multi-label case*/
// module.exports.confusion_matrix = function(stats)
function confusion_matrix(stats)
{	
	matrix = {}
	_.each(stats['data'], function(value, key, list){ 
		_.each(value['explanation']['TP'], function(value1, key, list){ 
			if (!(value1 in matrix))
				matrix[value1] = {}
			if (!(value1 in matrix[value1]))
				matrix[value1][value1] = 0
			matrix[value1][value1] = matrix[value1][value1] + 1
		}, this)

		_.each(value['explanation']['FP'], function(value1, key, list){ 
			if (!(value['explanation']['FN']))
				value['explanation']['FN'] = []
			_.each(value['explanation']['TP'].concat(value['explanation']['FN']), function(value2, key, list){ 
				if (!(value2 in matrix))
					matrix[value2] = {}
				if (!(value1 in matrix[value2]))
					matrix[value2][value1] = 0
				matrix[value2][value1] = matrix[value2][value1] + 1
			}, this)
		}, this)

		_.each(value['explanation']['FN'], function(value1, key, list){ 
			if (!(value1 in matrix))
				matrix[value1] = {}
			if (!("nolabel" in matrix[value1]))
				matrix[value1]["nolabel"] = 0
			matrix[value1]["nolabel"] = matrix[value1]["nolabel"] + 1
			
		}, this)			

	}, this)

	return matrix
}

/*@input - hash that represents table
@output - html table*/
module.exports.hash_to_htmltable = function(labelhash)
{
	keys = []
	_.each(labelhash, function(value, key, list){ 
		_.each(value, function(value1, key1, list){ 
			keys.push(key1)
			}, this)
		}, this)

	labelheader = Object.keys(labelhash)
	labelheader.push("nolabel")

	console.log("<html><body><table border=1 style='border-collapse: collapse'>")
	console.log("<th><td>"+((labelheader)).join("</td><td>")+"</td></th>")

_.each(labelhash, function(value, key, list){
	console.log("<tr><td>"+	(buildstringnosum(key, value, labelheader)).join("</td><td>")+"</td></tr>")
	}, this)

		console.log("</table>")
		// console.log()
		// process.exit(0)

}


// @stats - dataset in the format after test_hash, i.e. the hash with parameters 'data', 'stats', 'labels'
// output is the data labels where there is an error
module.exports.filtererror = function(stats)
{
	stats_filtered=[]
	 _.each(stats['data'], function(value, key, list){ 
		if ((value['explanation']['FP'].length != 0) || (value['explanation']['FN'].length != 0))
		{
		stats_filtered.push(value)	
		}
	});
	return stats_filtered
}


module.exports.bars_hash = function(data)
{ 
	labelhash = {}
	_.each(data, function(value, key, list){
		output = _.flatten((splitPartEqually(multilabelutils.normalizeOutputLabels(value.output))))		
		_.each(output, function(lab, key, list){
			if (!(lab in labelhash))
				{
				labelhash[lab] = {}
				labelhash[lab]['train'] = 0 
				}
			else
				labelhash[lab]['train'] =  labelhash[lab]['train'] + 1
			}, this)

		}, this)
	return labelhash
}

module.exports.bars_original = function(data)
{	
	alllabel = []
	_.each(data, function(value, key, list){
		alllabel = alllabel.concat(value.output)
	}, this)

	aggreg = _.countBy(alllabel, function(num) {return num})

	aggreglist = []
	_.each(aggreg, function(value, key, list){ 
		aggreglist.push([key,value])
		}, this)

	aggregarray = _.sortBy(aggreglist, function(num){ return num[0]});


	_.each(aggregarray, function(value, key, list){
		console.log(value[0])
		}, this)

	process.exit(0)

	// _.each(aggregarray, function(value, key, list){ 
	// 		console.log(value[0]+"\t"+value[1])
	// 	}, this)
}

/*@input - dataset
@output - the table in html format with intent attribute cooccurence.*/
module.exports.intent_attr_matrix = function(data)
{

labelhash = {}
labelheader = []

_.each(data, function(value, key, list){ 
	output = splitPartEqually(multilabelutils.normalizeOutputLabels(value.output))

	_.each(output[0], function(intent, key, list){ 
		if (!(intent in labelhash))
			labelhash[intent] = []
		labelheader = labelheader.concat(output[1])
		labelhash[intent] = labelhash[intent].concat(output[1])
	}, this)
}, this)

labelheader = _.uniq(labelheader)

_.each(labelhash, function(value, key, list){ 
	labelhash[key] = _.countBy(value, function(num) { return num })
}, this)

console.log("<html><body><table border=1 style='border-collapse: collapse'>")
console.log("<th><td>"+((labelheader)).join("</td><td>")+"</td></th>")

_.each(labelhash, function(value, key, list){
	console.log("<tr><td>"+	(buildstring(key, value, labelheader)).join("</td><td>")+"</td></tr>")
	}, this)

labelmarginal = []
_.each(labelheader, function(label, key, list){ 
	agg = 0
	_.each(labelhash, function(value, key, list){ 
		if (label in value)
			agg = agg + value[label]
		}, this)
	labelmarginal.push(agg)
	}, this)

console.log("<tr><td></td><td>"+labelmarginal.join("</td><td>")+"</td></tr>")
console.log("</table>")
}

function buildstring(intent, valhash, labelheader)
{
	str = [intent]
	_.each(labelheader, function(value, key, list){ 
		if (value in valhash)
			str.push(valhash[value])
		else
			str.push(0)
		}, this)

	sum = _.reduce(_.rest(str), function(memo, num){ return memo + num; }, 0)
	str.push(sum)
	return str
}


function buildstringnosum(intent, valhash, labelheader)
{
	str = [intent]
	_.each(labelheader, function(value, key, list){ 
		if (value in valhash)
			str.push(valhash[value])
		else
			str.push(0)
		}, this)
	return str
}

/*
@input - data - dataset
@output - set of graphs with distributions of intent and attributes.*/
module.exports.intent_attr_dist = function(data)
{
	alllabelhash = {}
	_.each(data, function(value, key, list){
			jsonlablist = value['output'].map(splitJson)
			_.each(jsonlablist, function(value1, key, list){ 
				if (!(value1[0] in alllabelhash))
					alllabelhash[value1[0]] = []
				alllabelhash[value1[0]].push(value1[1])
				}, this)
	}, this)

	_.each(alllabelhash, function(value, key, list){ 
		alllabelhash[key] = _.sortBy(_.pairs(_.countBy(value, function(num) {return num})),1)
		}, this)

	filehash = {}
	_.each(alllabelhash, function(hashattribute, intent, list){ 
		str = ""
		num = 0
		_.each(hashattribute, function(occurence, attribute, list){ 
			str = str + num + "\t\""+occurence[0]+"\"\t"+ occurence[1]+"\n"
			num = num + 1
			}, this)
		filehash[intent] = str
	}, this)

	_.each(filehash, function(value, intent, list){ 
		fs.writeFileSync(intent, value, 'utf-8', function(err) {console.log("error "+err); return 0 })
	}, this)

	_.each(alllabelhash, function(value, intent, list){ 
		command = "gnuplot -p -e \"reset; set term png truecolor size 1500,800; set grid ytics; set grid xtics; set output \'"+intent+".png\'; set boxwidth 0.5; set style fill solid; plot \'"+intent+"\' using 1:3:xtic(2) with boxes\""
		result = execSync.run(command)
	}, this)
	process.exit(0)
}


/*@data is a dataset in the original format (array of JSON with input output parameters)
output - list of the labels and the occurrences of the labels in the dataset.*/
module.exports.bars = function(data)
{ 	
	lalelarray = []
	lalelarray.push([])
	lalelarray.push([])
	lalelarray.push([])

	_.each(data, function(value, key, list){
		output = splitPartEqually(multilabelutils.normalizeOutputLabels(value.output))

		_.each(output, function(value, key, list){ 
			lalelarray[key]  = lalelarray[key].concat(value)
		}, this)
	}, this)

	labelgroup=[]
	_.each(lalelarray, function(value, key, list){
		labelgroup.push([])
		_.each(_.countBy(value, function(num) {return num}), function(value1, key1, list1){ 
			labelgroup[key].push([key1,value1])
			}, this)
	},this)

	labelsorted = []
	_.each(labelgroup, function(value, key, list){ 
		labelsorted.push(_.sortBy(value, function(num){ return num[1]}))
		}, this)


	_.each(labelsorted, function(value, key, list){ 
		_.each(value, function(value1, key, list){ 
				console.log(value1[0]+"\t"+value1[1])
			}, this)
		}, this)
	return labelsorted
}

// @data is a dataset in the original format (array of JSON with input output parameters)
// output - tree with the hierarchy of the labels.
module.exports.labeltree = function(data)
	{
	Observable = {}
		_.each(data, function(datum, key, list){				
			_.each(multilabelutils.normalizeOutputLabels(datum.output), function(lab, key, list){				
				_.each(splitJson(lab), function(element, key, list){
					if (key==0)
						if (!(element in Observable))
								Observable[element] = {}
					if (key==1)
						if (!(element in Observable[list[key-1]]))
								Observable[list[key-1]][element] = {}
					if (key==2)
						if (!(element in Observable[list[key-2]][list[key-1]]))
								Observable[list[key-2]][list[key-1]][element] = {}

				}, this)
			}, this)
		}, this)
	return Observable
	}

module.exports.extend_dict = function(aggreg, current)
	{
		for (label in current)
		{
			if (!(label in aggreg))
				{
					aggreg[label]={}
					for (attr in current[label])
						{
							aggreg[label][attr]=0
						}
				}

			for (attr in current[label])
				{
					aggreg[label][attr]= aggreg[label][attr] + current[label][attr]
				}

		}
		return aggreg
	}

module.exports.generate_labels = function(output)
{
	var tags = convertlabeltree()
	var lab = []
	var compos = []

	_.each(output[0], function(intent, key, list){
		_.each(output[2], function(value1, key, list){
			lab.push([intent,value1]) 
		 }, this) 
		_.each(output[1], function(attr, key, list){ 
			lab.push([intent, attr])
			_.each(output[2], function(value, key, list){ 
				lab.push([intent, attr, value])
				// lab.push([intent,value])
			}, this)
		}, this)
	}, this)

	_.each(tags, function(value1, key, list){ 
		_.each(lab, function(value2, key, list){ 
			if ((_.difference(value1,value2)==0)&&(_.difference(value2,value1)==0))
				compos.push(joinJson(value2))
		}, this)
	}, this)

	return compos
	// console.log(compos)
	// process.exit(0)
}

/*@output - is the label in the separate format (intent, attribute, value), observable - tree of the labels
output - list of the ambiguities for intents and labels.*/
// module.exports.intent_attr_label_ambiguity = function(output)
function intent_attr_label_ambiguity(output)
	{
	Observable = labeltree
	ambiguity = []
	_.each(output[1], function(attr, key, list){
			listt = []
			_.each(output[0], function(intent, key, list){
				if (Object.keys(Observable[intent]).indexOf(attr) != -1)
					{
					listt.push(intent)
					} 
				}, this)
			// console.log(listt)
			if (listt.length >= 2)
				{
					amb = {}
					amb['attr'] = attr
					amb['list'] = listt
					ambiguity.push(amb)
				}
			}, this)
	return ambiguity
	}

/*the same as previous but for the dataset
*/
// module.exports.intent_attr_dataset_ambiguity = function(data)
function intent_attr_dataset_ambiguity(data)
	{

	Observable = labeltree
	ambiguityset = []
	_.each(data, function(value, key, list){ 
			output = (splitPartEqually(multilabelutils.normalizeOutputLabels(value.output)))
			ambig = this.intent_attr_label_ambiguity(output)
			if (ambig.length != 0)
			ambiguityset.push({'input': value['input'],
							'output': value['output'],
							'conversion': output,
							'ambiguity':ambig})
		}, this)

	return ambiguityset
}

/*testSet - dataset
output - clone of the dataset*/
// module.exports.clonedataset = function(set)
 function clonedataset(set)

{
	set1 = []
	_.each(set, function(value, key, list){
		set1.push(_.clone(value))
		})
	return set1
}

function Compensate(json) {
		// console.log(json)
	js = splitJson(json)
	if ((js.length == 2) && (js[1].toString()[0] != js[1].toString()[0].toUpperCase()))
		{
		js.push(js[1])
		js[1] = ""
		}
	return js
}


function splitJson(json) {
	return splitJsonRecursive(_.isString(json) && /{.*}/.test(json)?
		JSON.parse(json):
		json);
}
 
function splitJsonRecursive(json) {
	if (!_.isObject(json))
		return [json];
	var firstKey = Object.keys(json)[0];
	var rest = splitJsonRecursive(json[firstKey]);
	rest.unshift(firstKey);
	return rest;
}

function splitPartEqually(json) {	
	label = []	
	_(3).times(function(n){
		buf = []
		_.each(json.map(Compensate), function(value, key, list){
			if (value.length>n)
			{
			if (_.compact(value[n].toString()).length != 0)
				buf = buf.concat(value[n])
			}
		})

		buf = _.uniq(buf)

		if ((buf.length > 0) && (typeof(buf[0])!="undefined"))
			label[n] = buf
		if ((typeof(buf[0])=="undefined"))
			label[n] = []
	})
	return label
}

function joinJson(parts) {
	var json = joinJsonRecursive(parts);
	return _.isString(json)? json: JSON.stringify(json);
}

function joinJsonRecursive(parts) {
	var firstKey = parts[0];
	if (parts.length<=1)
		return (firstKey=='true'? true: firstKey);
	else {
		var result = {};
		result[firstKey] = joinJsonRecursive(parts.slice(1));
		return result;
	}
}


module.exports = {
	aggregate_sagae: aggregate_sagae, 
	convertlabeltree: convertlabeltree,
	expl_struct: expl_struct,
	aggregate_results: aggregate_results,
	aggregate_lab: aggregate_lab,
	aggregate_label: aggregate_label,
	resolve_emptiness: resolve_emptiness,
	generate_possible_labels: generate_possible_labels,
	join_labels: join_labels, 
	semlang_ambiguity: semlang_ambiguity,
	bag_of_labels_to_components: bag_of_labels_to_components,
	aggregate_two_nested: aggregate_two_nested,
	clonedataset:clonedataset,
	confusion_matrix:confusion_matrix,
	intent_attr_label_ambiguity:intent_attr_label_ambiguity,
	intent_attr_dataset_ambiguity:intent_attr_dataset_ambiguity,
	aggregate_label_trick: aggregate_label_trick,
	aggregate_label_no_trick: aggregate_label_no_trick,
	find_path:find_path,
	aggreate_similar:aggreate_similar
}