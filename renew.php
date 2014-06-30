<?php
/**
 * AJAX script to renew patron loans in Alma
 *
 * Checks the user has required permissions,
 * then returns a JSON object containing renewal results
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
$useridentifier = $USER->idnumber;
$web_service_result = $alma->getUserLoans(array('arg0' => $useridentifier));

$renew = new SimpleXMLElement('<loan_renew_items/>');
$renew->addAttribute('xmlns', 'http://com/exlibris/urm/loan_renew_items/xmlbeans');
$renew->addChild('userIdentifier', $useridentifier);
$loanidlist = $renew->addChild('loanIdList');
foreach ($xb->item_loans->item_loan as $i) {
    $loanidlist->addChild('loanId', $i->loanId);
}
$params = array('arg0' => $renew->asXML());
$renewresponse = $alma->renewUserLoans($params);
header('Content-type: application/json');
echo json_encode($renewresponse);
