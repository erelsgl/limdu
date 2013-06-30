/**
 * @author Kyle Florence <kyle[dot]florence[at]gmail[dot]com>
 * @website https://github.com/kflorence/jquery-deserialize/
 * @version 1.2.1
 *
 * Dual licensed under the MIT and GPLv2 licenses.
 */
(function( jQuery, undefined ) {

	var push = Array.prototype.push,
	rcheck = /^(?:radio|checkbox)$/i,
	rplus = /\+/g,
	rselect = /^(?:option|select-one|select-multiple)$/i,
	rvalue = /^(?:button|color|date|datetime|datetime-local|email|hidden|month|number|password|range|reset|search|submit|tel|text|textarea|time|url|week)$/i;

	function getElements( elements ) {
		return elements.map(function() {
			return this.elements ? jQuery.makeArray( this.elements ) : this;
		}).filter( ":input:not(:disabled)" ).get();
	}

	function getElementsByName( elements ) {
		var current,
		elementsByName = {};

		jQuery.each( elements, function( i, element ) {
			current = elementsByName[ element.name ];
			elementsByName[ element.name ] = current === undefined ? element :
				( jQuery.isArray( current ) ? current.concat( element ) : [ current, element ] );
		});

		return elementsByName;
	}

	jQuery.fn.deserialize = function( data, options ) {
		var i, length,
		elements = getElements( this ),
		normalized = [];

		// A. Create a normalized array of elements of the form :
		//   [{name: name1, value: value1}, {name: name2, value: value2}, ...]

		if ( !data || !elements.length ) {
			return this;
		}

		if ( jQuery.isArray( data ) ) {
			normalized = data;

		} else if ( jQuery.isPlainObject( data ) ) {
			var key, value;

			for ( key in data ) {
				jQuery.isArray( value = data[ key ] ) ?
						push.apply( normalized, jQuery.map( value, function( v ) {
							return { name: key, value: v };
						})) : push.call( normalized, { name: key, value: value } );
			}

		} else if ( typeof data === "string" ) {
			var parts;

			data = data.split( "&" );

			for ( i = 0, length = data.length; i < length; i++ ) {
				parts = data[ i ].split( "=" );
				push.call( normalized, {
					name: decodeURIComponent( parts[ 0 ] ),
					value: decodeURIComponent( parts[ 1 ].replace( rplus, "%20" ) )
				});
			}
		}

		if ( !( length = normalized.length ) ) {
			return this;
		}

		var current, element, j, len, name, property, type, value,
		change = jQuery.noop,
		complete = jQuery.noop,
		names = {};

		options = options || {};
		elements = getElementsByName( elements );

		// Backwards compatible with old arguments: data, callback
		if ( jQuery.isFunction( options ) ) {
			complete = options;

		} else {
			change = jQuery.isFunction( options.change ) ? options.change : change;
			complete = jQuery.isFunction( options.complete ) ? options.complete : complete;
		}
		//alert(JSON.stringify(elements));

		for ( i = 0; i < length; i++ ) {
			current = normalized[ i ];

			name = current.name;
			value = current.value;
			element = elements[ name ]; 

			if ( !element ) {
				//alert("The form contains no element named '"+name+"'");
				continue;
			}

			type = ( len = element.length ) ? element[ 0 ] : element;
			type = ( type.type || type.nodeName ).toLowerCase();
			//alert("element named '"+name+"' is of type '"+type+"'");
			property = null;

			if ( rvalue.test( type ) ) {  // element contains a value
				if ( len ) {
					j = names[ name ];
					element = element[ names[ name ] = ( j == undefined ) ? 0 : ++j ];
				}

				change.call( element, ( element.value = value ) );

			} else if ( rcheck.test( type ) ) {   // element is a checkbox or a radio button
				property = "checked";

			} else if ( rselect.test( type ) ) {   // element is a select-box
				property = "selected";
			}

			//alert("element named '"+name+"' is of type '"+type+"' and has len="+len+" and property '"+property+"'");

			if ( property ) {
				if ( !len ) {
					element = [ element ];
					len = 1;
				}

				for ( j = 0; j < len; j++ ) {
					current = element[ j ];

					if ( current.value == value ) {
						change.call( current, ( current[ property ] = true ) && value );
					}
				}
			}
		}

		complete.call( this );

		return this;
	};

})( jQuery );
