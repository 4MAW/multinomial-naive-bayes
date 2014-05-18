/**
 * Provides methods to print colored messages in console.
 *
 * @class log
 */

var colors = require( 'colors' );

/**
 * Prints given error in console.
 * @method error
 * @param  {error} err Error to print.
 * @param  {string} label Label to print instead of "ERROR".
 */
function logError( err, label ) {
	if ( typeof label === 'undefined' ) label = 'ERROR';
	console.log( ( '[' + label + ']' ).red + ' ' + err );
}

/**
 * Prints given info in console.
 * @method info
 * @param  {string} inf Information to print.
 * @param  {string} label Label to print instead of "INFO".
 */
function logInfo( inf, label ) {
	if ( typeof label === 'undefined' ) label = 'INFO';
	console.log( ( '[' + label + ']' ).blue + ' ' + inf );
}

/**
 * Prints given success info in console.
 * @method success
 * @param  {string} suc Information to print.
 * @param  {string} label Label to print instead of "OK".
 */
function logSuccess( suc, label ) {
	if ( typeof label === 'undefined' ) label = 'OK';
	console.log( ( '[' + label + ']' ).green + ' ' + suc );
}

/**
 * Prints given status info in console.
 * @method status
 * @param  {string} status Information to print.
 * @param  {string} label Label to print instead of "STATUS".
 */
function logStatus( status, label ) {
	if ( typeof label === 'undefined' ) label = 'STATUS';
	console.log( ( '[' + label + ']' ).magenta + ' ' + status );
}

/**
 * Prints given status info in console.
 * @method warn
 * @param  {string} status Information to print.
 * @param  {string} label Label to print instead of "STATUS".
 */
function logWarn( status, label ) {
	if ( typeof label === 'undefined' ) label = 'WARNING';
	console.log( ( '[' + label + ']' ).yellow + ' ' + status );
}

module.exports = {
	error: logError,
	info: logInfo,
	success: logSuccess,
	status: logStatus,
	warn: logWarn
};