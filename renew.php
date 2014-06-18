<?php
/**
 * AJAX script to renew patron loans in Alma
 *
 * Checks the user has required permissions, then returns a JSON object containing renewal results
 *
 * @package    block_alma
 * @copyright  2014 London School of Economics
 * @author     Chris Fryer <c.j.fryer@lse.ac.uk>
 */
define('AJAX_SCRIPT', true);
require_once('../../config.php');

if (isloggedin() && confirm_sesskey()) {
    global $USER;

    $wsdl            = get_config('block_alma', 'wsdl');
    $soapuser        = get_config('block_alma', 'soapuser');
    $institutioncode = get_config('block_alma', 'institutioncode');
    $soappassword    = get_config('block_alma', 'soappassword');

    $login = "AlmaSDK-{$soapuser}-institutioncode-{$institutioncode}";

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
    echo json_encode($renewresponse);
} else {
    header('HTTP/1.1 403 Forbidden');
}
