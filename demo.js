console.log("Hello world!");


/* Perceptron demo: */

var perceptron = require('perceptron/perceptron')

var and = perceptron()

and.train([1, 1], 1)
and.train([0, 1], 0)
and.train([1, 0], 0)
and.train([0, 0], 0)

// practice makes perfect (we hope...)
while(!and.retrain()) {}

console.log("2 FEATURES: ");
console.log(and.perceive([1, 1])) // 1
console.log(and.perceive([0, 1])) // 0
console.log(and.perceive([1, 0])) // 0
console.log(and.perceive([0, 0])) // 0
console.log(and.perceive([2, 0])) // ?
console.log(and.perceive([0, 2])) // ?

console.log("3 FEATURES: ");
console.log(and.perceive([0, 0, 0])) // 0
console.log(and.perceive([0, 0, 1])) // 0
console.log(and.perceive([0, 1, 0])) // 0
console.log(and.perceive([1, 0, 0])) // 0
console.log(and.perceive([1, 1, 0])) // 0
console.log(and.perceive([1, 0, 1])) // 0
console.log(and.perceive([0, 1, 1])) // 0
console.log(and.perceive([1, 1, 1])) // 0

console.dir(and);
