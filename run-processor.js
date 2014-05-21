var processor = require( './processor.js' ),
	fs = require( 'fs' );

processor(
	// Source.
	fs.createReadStream(
		"./data/data.json", {
			flags: 'r',
			encoding: 'utf-8'
		}
	),
	// Destination.
	"./data/",
	// Stopwords.
	JSON.parse( fs.readFileSync( "./data/stopwords.json" ) ),
	// Chunk size, to split source data in multiple chunks.
	20000
);