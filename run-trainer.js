var trainer = require( './trainer.js' ),
	fs = require( 'fs' );

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
	// Value of epsilon (to soft results)
	0.00001
);