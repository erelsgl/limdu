/**
 * Demonstrates FeatureLookupTable.
 * 
 * @author Erel Segal-Halevi
 * @since 2013-06
 */

console.log("FeatureLookupTable demo start");

var FeatureLookupTable = require('../FeatureExtractor/FeatureLookupTable');

console.log("\n adding samples incrementally:");
var table = new FeatureLookupTable();
var sample1 = {a: 111, b: 222, c: 333};
var sample2 = {a: 1111, d: 4444, e: 5555};
var sample3 = {c: 33333, e: 55555, g: 77777};
var array1 = table.hashToArray(sample1);
var array2 = table.hashToArray(sample2);
var array3 = table.hashToArray(sample3);
console.dir(array1);
console.dir(array2);
console.dir(array3);
console.dir(table.arrayToHash(array1));
console.dir(table.arrayToHash(array2));
console.dir(table.arrayToHash(array3));

console.log("\n adding all samples together:");
var table = new FeatureLookupTable();
var arrays = table.hashesToArrays([sample1, sample2, sample3]);
console.dir(arrays);
console.dir(table.arraysToHashes(arrays));

console.log("FeatureLookupTable demo end");
