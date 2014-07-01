<?php
/**
 * AJAX endpoint to get patron loans from Alma
 *
 * Checks the user has required permissions,
 * then returns a JSON object containing loans
 *
 * @package    block_alma
 * @copyright  2014 London School of Economics
 * @author     Chris Fryer <c.j.fryer@lse.ac.uk>
 */
define('AJAX_SCRIPT', true);
require_once('../../config.php');

require_login();
require_sesskey();

$wsdl            = get_config('block_alma', 'wsdl');
$soapuser        = get_config('block_alma', 'soapuser');
$institutioncode = get_config('block_alma', 'institutioncode');
$password        = get_config('block_alma', 'soappassword');
$useridentifier  = $USER->idnumber;

$login = "AlmaSDK-{$soapuser}-institutionCode-{$institutioncode}";

$options = array(
                'login'     => $login,
                'password'  => $password,
                'trace'     => true, // Not for production
                'exception' => true,
                );

$alma = new SoapClient($wsdl, $options);
$soapresult = $alma->getUserLoans(array('arg0' => $useridentifier));
$searchresults = simplexml_load_string($soapresult->SearchResults);
$namespaces = $searchresults->getNameSpaces(true); // recursive

if ($searchresults->errorsExist == 'true') {
    // see $searchresults->errorList->error->errorMessage
    $output  = json_encode($searchresults);
} else {
    $searchresult = $searchresults->result->search_web_service->searchResult;
    $xb           = $searchresult->children($namespaces['xb']);
    $output       = json_encode($xb);
}
header('Content-type: application/json');
echo $output;
