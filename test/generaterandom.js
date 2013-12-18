/**
 * Generating random string with given number of words and generating random list 
 * with given length with element from the given list
 *
 * @author Vasily Konovalov
 */

module.exports = {

  /* 
  * Generate random string with the given length 
  * @param length - the length of the required random string.
  *
  */

  random_string: function (length) {
  	var chars = '0123456789ABCDEFGHIJKLMNOPQRSTUVWXTZabcdefghiklmnopqrstuvwxyz';
  	length = length ? length : 10;
    var string = '';
    for (var i = 0; i < length; i++) {
      var word_length = Math.floor(Math.random() * 10+1);
      for (var j = 0; j <= word_length; j++)
      {
      	var randomNumber = Math.floor(Math.random() * chars.length);
      	var ch = chars.substring(randomNumber, randomNumber + 1);
      	string += ch
    	}  
    	string += " "
  	}
    return string;
  },

  random_list_length: function(list) {
    return this.random_list(Math.floor(Math.random() * 5), list)
  },

  /* 
  * Generate random list with the given length with element from the given list
  * @param length - the length of the required random list
  * @param list - the source list for the elements of the new list
  *
  */
  
  random_list: function(length, list) {
    var result = []
    for (var i = 0; i < length; i++) {
      result.push(list[Math.floor(Math.random()*list.length)])
      }
    return result
  },

}