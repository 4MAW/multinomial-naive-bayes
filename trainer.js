/**
 * Reads processed data and creates classifiers.
 *
 * @class trainer
 */

// Dependencies.

var log = require( './log.js' ),
	events = require( 'events' ),
	fs = require( 'fs' ),
	Q = require( 'q' );

// Functions.

/**
 * Creates a classifier with training samples from given stream.
 *
 * @param  {readStream}  stream      Stream with a JSON array of posts:
 *                                   [ {
 *                                     "name": "category",
 *                                     "tfs": { "term": count }
 *                                   } ]
 * @param  {wS}          wS          Stream where classifiers will be written.
 * @param  {Array}       categories  Array of names of categories. Must match
 *                                   strings in "name" attribute of posts.
 * @param  {Number}      epsilon     Value used to soft probabilities.
 */
module.exports = function ( stream, wS, categories, epsilon ) {

	epsilon = ( epsilon === undefined ) ? 0.00001 : epsilon;

	var ev = new events.EventEmitter(),
		buffer = "",
		tokens = {},
		count = 0,
		categories_tokens = {},
		total_tokens = {},
		classifiers = {},
		posts_categories = {};

	for ( var c in categories ) {
		var cat = categories[ c ];
		posts_categories[ cat ] = 0;
		categories_tokens[ cat ] = {};
		total_tokens[ cat ] = 0;
		classifiers[ cat ] = {
			aPriori: 0,
			vector: {}
		};
	}

	/**
	 * Processes current buffer to extact possible posts.
	 */
	function pump() {
		for ( var i = 0, start = 0; i < buffer.length; start += 1 ) {
			var chunk = buffer.substring( start, i );
			var success = process( chunk );
			start = i;
			var offset = buffer.substring( start ).indexOf( "}" ) + 2;
			if ( offset === 0 )
				i = buffer.length;
			else
				i += offset;
		}
		buffer = buffer.slice( start + 1 );
	}

	/**
	 * Processes given chunk, if possible.
	 * @param  {string} chunk Chunk to process.
	 * @return {boolean}      Whether given chunk was a valid post or not.
	 */
	function process( chunk ) {
		if ( chunk.length > 0 ) {
			try {
				var obj = JSON.parse( chunk );

				count++;
				if ( count % 10000 === 0 )
					log.info( count / 10000 + "0k posts processed" );

				posts_categories[ obj.name ]++;
				for ( var t in obj.tfs ) {
					var f = obj.tfs[ t ];
					if ( tokens[ t ] === undefined ) tokens[ t ] = true;
					var c = categories_tokens[ obj.name ];
					total_tokens[ obj.name ] += f;
					if ( c[ t ] === undefined ) {
						c[ t ] = f;
					} else {
						c[ t ] += f;
					}
				}

				return true;
			} catch ( e ) {
				//console.log( e );
			}
		}
		return false;
	}

	// Stream reading.
	stream.on( 'data', function ( chunk ) {
		buffer += chunk.toString();
		pump();
	} );

	// Stream ended, so we can finally create the classifiers.
	stream.on( 'end', function () {
		log.success( 'Reading finished' );
		log.info( 'Creating multinomial classifiers' );
		for ( var _c in categories ) {
			var c = categories[ _c ];
			var tfs = categories_tokens[ c ];
			classifiers[ c ].aPriori = Math.log( posts_categories[ c ] / count );
			for ( var t in tokens ) {
				if ( tfs[ t ] === undefined ) tfs[ t ] = 0;
				tfs[ t ] /= total_tokens[ c ];
				if ( tfs[ t ] < epsilon ) tfs[ t ] = epsilon;
				if ( tfs[ t ] > 1 - epsilon ) tfs[ t ] = 1 - epsilon;
				if ( tfs[ t ] > epsilon )
					classifiers[ c ].vector[ t ] = Math.log( tfs[ t ] );
			}
		}
		log.success( 'Multinomial classifier created' );

		var defer = Q.defer();
		var chain = defer.promise;

		var times = 0;

		var tryWrite = function ( _id, wS ) {
			return function () {
				var id = categories[ _id ];
				var obj = classifiers[ id ];
				var ok = wS.write( "\"" + id + "\":" + JSON.stringify( obj ) );
				if ( _id < categories.length - 1 ) {
					wS.write( "," );
					if ( ok ) tryWrite( _id + 1, wS )();
					else {
						log.warn( 'Buffer full, retrying later: ' + ( ++times ) );
						setTimeout( tryWrite( _id + 1, wS ), 1000 );
					}
				} else {
					wS.write( "}" );
					wS.end();
					log.status( 'Everything in the write stream' );
				}
			};
		};

		wS.write( "{" );
		tryWrite( 0, wS )();
		wS.on( 'finish', function () {
			log.success( 'Data saved!' );
		} );
	} );

};