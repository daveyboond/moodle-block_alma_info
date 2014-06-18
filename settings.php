<?php
/**
 * Settings for component 'block_alma'
 *
 * @package   block_alma
 * @copyright 2014 London School of Economics {@link http://www.lse.ac.uk/}
 * @author    Chris Fryer <c.j.fryer@lse.ac.uk>
 */
defined('MOODLE_INTERNAL') || die;
$settings->add(new admin_setting_configtext('block_alma/wsdl', get_string('wsdlurl', 'block_alma')));
//                       get_string('wsdldescription', 'block_alma'));
$settings->add(new admin_setting_configtext('block_alma/soapuser', get_string('soapuser', 'block_alma')));
//                       get_string('soapuserdescription', 'block_alma'));
$settings->add(new admin_setting_configpasswordunmask('block_alma/soappassword', get_string('soappassword', 'block_alma')));
//                       get_string('soappassworddescription', 'block_alma'));
$settings->add(new admin_setting_configtext('block_alma/institutioncode', get_string('institutioncode', 'block_alma')));
//                       get_string('institutioncodedescription', 'block_alma'));

