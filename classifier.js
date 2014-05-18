/**
 * Offers methods to classify URLs and texts.
 *
 * @class classifier
 */

// Dependencies.

var fs = require( 'fs' ),
	Q = require( 'q' ),
	request = require( 'hyperquest' ),
	Natural = require( 'natural' ),
	Readability = require( 'readabilitySAX' ),
	//NGrams = Natural.NGrams,
	//NounInflector = new Natural.NounInflector(),
	Tokenizer = new Natural.WordTokenizer( {
		pattern: /[^a-zA-Z\u00C0-\u017F]+/
	} );

/**
 * Given a URL, returns a promise which will be revolved giving category's name.
 *
 * @method classifyURL
 *
 * @param  {string} url         URL to classify.
 * @param  {Object} classifiers Classifiers to use to find the proper category.
 * @param  {Array}  stopwords   Array of stopwords (strings) to remove.
 * @param  {Number} epsilon     Value to be used to soft probabilities.
 * @return {promise}            Promise which will be resolved giving category's
 *                              name.
 */
var classifyURL = function ( url, classifiers, stopwords, epsilon ) {
	var method_defer = Q.defer();


	if ( url.match( /https?:\/\/(www\.)?[-a-zA-Z0-9@:%._\+~#=]{2,256}\.[a-z]{2,4}\b([-a-zA-Z0-9@:%_\+.~#?&//=]*)/g ) ) {

		var defer = Q.defer();


		var read = Readability.createWritableStream( {}, function ( i ) {
			defer.resolve( i.html.replace( /(<([^>]+)>)/ig, "" ).toLowerCase() );
		} );

		var r = request( url );
		r.on( 'error', function ( err ) {
			//console.log( 'PROCESSING: ' + url + '\n\t' + err );
			defer.reject( err );
		} );
		r.on( 'response', function ( res ) {
			this.pipe( read );
		} );

		defer.promise.then( function ( text ) {
			var c = classifyText( text, classifiers, stopwords, epsilon );
			method_defer.resolve( c );
		} );

	} else {
		method_defer.resolve( 'Unknown' );
	}

	return method_defer.promise;
};

/**
 * Given a text, returns a its category.
 *
 * @method classifyText
 *
 * @param  {string} text         Text to classify.
 * @param  {Object} classifiers Classifiers to use to find the proper category.
 * @param  {Array}  stopwords   Array of stopwords (strings) to remove.
 * @param  {Number} epsilon     Value to be used to soft probabilities.
 * @return {strng}              Category's name.
 */
var classifyText = function ( text, classifiers, stopwords, epsilon ) {
	var tokens = Tokenizer.tokenize( text );


	tokens_list = tokens.filter( function ( i ) {
		return stopwords.indexOf( i ) < 0;
	} );

	tokens = {};

	for ( var _i in tokens_list ) {
		var tkn = tokens_list[ _i ];
		if ( tokens[ tkn ] === undefined ) {
			tokens[ tkn ] = 1;
		} else {
			tokens[ tkn ]++;
		}
	}

	var max = {
		c: undefined,
		s: 1
	};

	var log_epsilon = Math.log( epsilon );

	for ( var _c in classifiers ) {
		var score = classifiers[ _c ].aPriori;
		for ( var _t in tokens ) {
			var ctf = classifiers[ _c ].vector[ _t ];
			ctf = ( ctf === undefined ) ? log_epsilon : ctf;
			score += ctf * tokens[ _t ];
		}
		if ( max.c === undefined || score > max.s ) {
			max = {
				c: _c,
				s: score
			};
		}
	}

	return max.c;
};

module.exports = {
	classifyURL: classifyURL,
	classifyText: classifyText
};