# Components

There are three different components:

* **processor**: Extracts tokens from source and creates vector of occurrences to make training faster.
* **trainer**: Given processed data generates as many classifiers as required by categories.
* **classifier**: Given some text (or URL) classifies it.

# Usage

You can run the demo with:

```javascript
npm run-script processor // Process training data.
npm run-script trainer // Generates classifiers.
npm run-script classifier // Loads classifiers and outputs the classification of some articles.
```

Depending on the format of the training data it might not be needed to process it before running trainer. See *Data format* section to know more about the expected format.

```javascript

var fs = require( 'fs' ),
	processor = require( './processor.js' ),
	trainer = require( './trainer.js' ),
	classifier = require( './classifier.js' );

// First of all we process the source data.

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

// Then we can create the classifiers.

trainer(
	// Training set.
	fs.createReadStream(
		"./data/data_tfs_2k_0.json", {
			flags: 'r',
			encoding: 'utf-8'
		}
	),
	// Path where classifiers will be saved.
	fs.createWriteStream(
		"./data/classifiers.json"
	),
	// Names of categories where content will be classified.
	// Take into account that categories here must match categories in training set.
	[
		"Activismo",
		"Actualidad",
		"Cine & TV",
		"Deportes",
		"Economía",
		"Entretenimiento",
		"Estilo",
		"Estilo de vida",
		"Motor",
		"Música",
		"Tecnología",
		"Viajes & Eventos"
	],
	// Value of epsilon (to soft results).
	0.00001
);

// Finally we can classify texts.

var category = classifier.classifyText(
	// Text to classify.
	"Hello world",
	// Classifiers.
	JSON.parse( fs.readFileSync( "./data/classifiers.json" ) ),
	// Stopwords to remove.
	JSON.parse( fs.readFileSync( "./data/stopwords.json" ) ),
	// Value of epsilon (to soft results).
	0.00001
);


```

# Data format

Source data is expected to follow the following format:

```javascript
[ {
	"content": "Text of the article, can contain HTML tags (they are removed)",
	"name": "Name of the category. Be sure that it matches one of the categories defined in the array of categories given to trainer"
} ]
```



