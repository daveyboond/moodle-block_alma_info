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
$action          = required_param('action', PARAM_ALPHA);
$renewloanids    = optional_param('loanids', '', PARAM_SEQUENCE);

$login = "AlmaSDK-{$soapuser}-institutionCode-{$institutioncode}";

$options = array(
                'login'     => $login,
                'password'  => $password,
                'trace'     => true, // Not for production
                'exception' => true,
                );

$alma = new SoapClient($wsdl, $options);

if ($action == 'getloans') {
    // Call the Alma web service
    $soapresult = $alma->getUserLoans(array('arg0' => $useridentifier));
    // Parse into SimpleXMLElement
    $searchresults = simplexml_load_string($soapresult->SearchResults);
    // This is hacky, but the SimpleXMLElement class is unruly and this
    // gives us a stdClass we can actually work with. (TMBABWTDI)
    $output = json_decode(json_encode($searchresults));
    if ($searchresults->errorsExist != 'true') {
        // This is the portion of the response containing patron loans
        $searchresult = $searchresults->result->search_web_service->searchResult;
        // which is in the 'xb:' namespace
        $namespaces = $searchresults->getNameSpaces(true);
        $xb = $searchresult->children($namespaces['xb']);
        // Create an old-fashioned array out of SimpleXML's Iterable filth
        $itemloans = array();
        foreach ($xb->item_loans->item_loan as $itemloan) {
            if (strtotime($itemloan->dueDate) < time()) { // HACK
                $itemloan->loanStatus = 'Overdue';
            }
            array_push($itemloans, $itemloan);
        }
        // ... which we can append to the stdClass
        $output->result->search_web_service->searchResult->item_loans = $itemloans;
    }
    $json = json_encode($output);
} elseif ($action == 'renew') {
    $renew = new SimpleXMLElement('<loan_renew_items/>');
    $renew->addAttribute('xmlns', 'http://com/exlibris/urm/loan_renew_items/xmlbeans');
    $renew->addChild('userIdentifier', $useridentifier);
    $loanidlist = $renew->addChild('loanIdList');
    foreach (explode(',', $renewloanids) as $r) {
        $loanidlist->addChild('loanId', $r);
    }
    $params = array('arg0' => $renew->asXML());
    $renewresponse = $alma->renewUserLoans($params);
    $searchresults = simplexml_load_string($renewresponse->SearchResults);
    $output = json_decode(json_encode($searchresults));
    $namespaces = $searchresults->getNameSpaces(true);
    $xb = $searchresults->result->children($namespaces['xb']);
    $renewresults = array();
    foreach ($xb->loan_renew as $loanrenew) {
        array_push($renewresults, $loanrenew);
    }
    $output->result->loan_renew = $renewresults;
    $json = json_encode($output);
}
header('Content-type: application/json');
echo $json;
