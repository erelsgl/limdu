/**
 * A utility function for Homer.
 */
var _ = require("underscore")._;

/**
 * @param json a JSON object, such as: {Offer: {Salary: 20000}}
 * @param depth an integer >= 1.
 * @return a view of the top-level parts of the json object.
 * -- For example, for depth=1: "Offer". For depth=2: "{Offer: Salary}". For depth=3: "{Offer: {Salary: 20000}}", etc.
 */
function shallowJson(json, depth) {
	if (!_.isObject(json))
		return json;
	var firstKey = Object.keys(json)[0];
	if (depth<=1) {
		return firstKey;
	} else {
		var shallow = {};
		shallow[firstKey] = shallowJson(json[firstKey], depth-1);
		return shallow;
	}
}


/**
 * @param json a JSON object, such as: {Offer: {Salary: 20000}}
 * @return an array of the parts of the json.
 * -- For example: ["Offer", "Salary", "20000"]
 */
function splitJson(json) {
	if (!_.isObject(json))
		return [json];
	var firstKey = Object.keys(json)[0];
	var rest = splitJson(json[firstKey]);
	rest.unshift(firstKey);
	return rest;
}

module.exports = {
	shallowJson: shallowJson,
	splitJson: splitJson,
}

