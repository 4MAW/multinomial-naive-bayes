var trainer = require( './trainer.js' ),
	fs = require( 'fs' );

trainer(
	fs.createReadStream(
		"./data/data_tfs_2k_0.json", {
			flags: 'r',
			encoding: 'utf-8'
		}
	),
	fs.createWriteStream(
		"./data/classifiers.json"
	), [
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
	0.00001
);