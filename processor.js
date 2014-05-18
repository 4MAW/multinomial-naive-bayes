/**
 * Reads training sets and extracts features for the classifier.
 *
 * @class processor
 */

// Dependencies.

var log = require( './log.js' ),
	events = require( 'events' ),
	fs = require( 'fs' ),
	Q = require( 'q' ),
	Natural = require( 'natural' ),
	//NGrams = Natural.NGrams,
	Tokenizer = new Natural.WordTokenizer( {
		pattern: /[^a-zA-Z\u00C0-\u017F]+/
	} );

/**
 * Reads given readStream looking for posts in JSON format and processed them,
 * writing results in destination folder.
 *
 * @param {readStream} source      Read stream with posts to process.
 * @param {string}     destination Path to folder where results will be stored.
 * @param {Array}      stopwords   Array of stopwords (strings) to remove.
 * @param {int}        l           Maximum amount of posts stored in each chunk.
 */
module.exports = function ( source, destination_folder_path, stopwords, l ) {

	stopwords = ( stopwords === undefined ) ? [] : stopwords;
	var limit = ( l === undefined ) ? 20000 : l;

	log.info( 'Will save results on ' + destination_folder_path );

	var ev = new events.EventEmitter(),
		buffer = "",
		processed_count = 0,
		current_segment = 0,
		added_current_segment = 0,
		writeStreams = [];

	/**
	 * Returns the items in first array that are not in second array.
	 * @param  {Array} a Array with items to maintain.
	 * @param  {Array} b Array with items to remove.
	 * @return {Array}   Items of a not in b.
	 */
	var diff = function ( a, b ) {
		return a.filter( function ( i ) {
			return b.indexOf( i ) < 0;
		} );
	};

	/**
	 * Processes current buffer to extact possible posts.
	 */
	function pump() {
		for ( var i = 0, start = 0; i < buffer.length; start += 2 ) {
			var chunk = buffer.substring( start, i );
			var success = process( chunk );
			start = i;
			var offset = buffer.substring( start ).indexOf( "}" ) + 1;
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
				obj.content = obj
					.content
					.replace( /<\/?[^<]*>/gi, " " )
					.toLowerCase();
				obj.tokens = diff( Tokenizer.tokenize( obj.content ), stopwords );
				obj.content = undefined;
				//obj.tokens = NGrams.trigrams( diff( obj.tokens, stopwords ) );
				obj.tfs = {};

				for ( var t = 0; t < obj.tokens.length; t++ ) {
					//var tkn = NounInflector.singularize( obj.tokens[ t ] );
					//var tkn = Natural.PorterStemmerEs.stem( obj.tokens[ t ] );
					var tkn = obj.tokens[ t ];

					if ( obj.tfs[ tkn ] === undefined ) obj.tfs[ tkn ] = 1;
					else obj.tfs[ tkn ]++;
				}

				obj.tokens = undefined;

				processed_count++;
				if ( processed_count % 10000 === 0 )
					log.info( processed_count / 10000 + "0k posts processed" );

				if ( added_current_segment === 0 ) {
					log.status( 'Opened stream for segment ' + current_segment );
					var filename = destination_folder_path + "data_tfs_";
					filename += Math.floor( limit / 1000 ) + "k_";
					filename += current_segment + ".json";
					var ws = fs.createWriteStream( filename );
					ws.write( "[" );
					writeStreams[ current_segment ] = ws;
					ws.on( 'drain', function () {
						//log.status( 'Stream resumed' );
						source.resume();
					} );
				} else {
					writeStreams[ current_segment ].write( "," );
				}

				ev.emit( 'post', [ obj, current_segment ] );

				added_current_segment++;

				if ( added_current_segment === limit ) {

					writeStreams[ current_segment ].write( "]" );
					writeStreams[ current_segment ].end();
					log.success( 'Finished with segment ' + current_segment );

					current_segment++;
					added_current_segment = 0;
					log.info( 'Started parsing segment ' + current_segment );
				}

				return true;
			} catch ( e ) {
				//console.log( e );
			}
		}
		return false;
	}

	// Stream reading.
	source.on( 'data', function ( chunk ) {
		buffer += chunk.toString();
		pump();
	} );

	// Each time a post is found, write it.
	ev.on( 'post', function ( data ) {
		var obj = data[ 0 ];
		var segment = data[ 1 ];
		var wS = writeStreams[ segment ];
		if ( !wS.write( JSON.stringify( obj ) ) ) {
			source.pause();
		}
	} );

	// When finished, close last writing stream.
	source.on( 'end', function () {
		writeStreams[ current_segment ].write( "]" );
		writeStreams[ current_segment ].end();
		log.success( 'Finished with segment ' + current_segment );
	} );
};