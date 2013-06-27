/**
 * Static Utilities for serializing classifiers (or other objects).
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

var fs = require('fs');

/**
 * Save a trained classifier to a file. Synchronous version.
 * @param createNewClassifierFunction a function for creating a new (untrained) classifier. This function will be saved verbatim in the file, in order to reproduce the exact type of the classifier.
 * @param contextFolderForFunction the folder from where the function is called (usually this will be "__dirname"). This folder will be added to the "require" statements, so that they work no matter where you do the deserialization. 
 * @param trainedClassifier This is the trained classifier itself. It should have "toJSON" and "fromJSON" functions (but if "toJSON" is not present, then the object itself will be saved).
 * @param filename path to the file where the classifier will be saved.   
 */
exports.saveSync = function(createNewClassifierFunction, contextFolderForFunction, trainedClassifier, filename) {
	// convert the function to a string that can be evaluated later, at load time, to create a new classifier:
	var createNewClassifierString = createNewClassifierFunction.toString();
	
	// add context to the 'require' statements:
	createNewClassifierString = createNewClassifierString.replace(/(require\s*\(\s*['"])[.]/g, "$1"+contextFolderForFunction+"/.");
	
	if (!trainedClassifier.fromJSON) {
		throw new Error("trainedClassifier does not have a fromJSON method - you will not be able to restore it");
	}

	var trainedClassifierJson;
	if (!trainedClassifier.toJSON) {
		console.warn("trainedClassifier does not have a toJSON method - using the trainedClassifier itself as its JSON representation");
		trainedClassifierJson = trainedClassifier;
	} else {
		trainedClassifierJson = trainedClassifier.toJSON();
	}

	var json = {
		createNewClassifierString: createNewClassifierString,
		trainedClassifier: trainedClassifierJson,
	};
	var text = JSON.stringify(json,null,"\t");
	fs.writeFileSync(filename, text, 'utf8');
	
	// load the classifier, to make sure there are no exceptions:
	var reloadedClassifier = exports.loadSync(filename);
	if (!reloadedClassifier) {
		throw new Error("Cannot reload the classifier that was saved in '"+filename+"'"); 
	}
}

/**
 * Load a trained classifier from a file. Synchronous version.
 * @param filename path to the file where the classifier was saved. 
 * @note the 
 */
exports.loadSync = function(filename) {
	var text = fs.readFileSync(filename);
	var json = JSON.parse(text);
	if (!json.createNewClassifierString) {
		console.dir(json);
		throw new Error("Cannot find createNewClassifierString in file '"+ filename+"'");
	}

	var createNewClassifierString = "("+json.createNewClassifierString+")";
	var createNewClassifierFunction = eval(createNewClassifierString);
	try {
		var newClassifier = createNewClassifierFunction();
	} catch (error) {
		console.log(json.createNewClassifierString);
		throw new Error("Error in creating new classifier from function in file '"+ filename+"': "+error);
	}
	
	if (!newClassifier) {
		console.dir(json);
		throw new Error("Cannot create new classifier from function in file '"+ filename+"'");
	}
	return newClassifier.fromJSON(json.trainedClassifier);
}
