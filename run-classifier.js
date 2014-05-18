var classifier = require( './classifier.js' ),
	fs = require( 'fs' );

var test_classifier_url = function ( url ) {
	classifier.classifyURL(
		url,
		JSON.parse( fs.readFileSync( "./data/classifiers.json" ) ),
		JSON.parse( fs.readFileSync( "./data/stopwords.json" ) ),
		0.00001
	).then( function ( category ) {
		console.log( "Category for " + url + " is " + category );
	} );
};

var test_classifier_text = function ( text ) {
	var category = classifier.classifyText(
		text,
		JSON.parse( fs.readFileSync( "./data/classifiers.json" ) ),
		JSON.parse( fs.readFileSync( "./data/stopwords.json" ) ),
		0.00001
	);
	console.log( "Category for given text is " + category );
};

test_classifier_url( "http://es.wikinews.org/wiki/Una_mujer_es_designada_para_presidir_la_iglesia_anglicana_de_EUA" );

test_classifier_text( 'La Iglesia Episcopal en los Estados Unidos de América ha elegido a una mujer para presidir su confesión. Se trata de Katharine Jefferts, obispo de Nevada, de 52 años, casada y con una hija, quien sucederá al obispo Frank T. Griswold, quien desde ahora será obispo presidente de la rama norteamericana de la iglesia anglicana.' );