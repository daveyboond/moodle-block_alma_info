<?php
/**
 * Block class for 'block_alma'
 *
 * @package   block_alma
 * @copyright 2014 London School of Economics {@link http://www.lse.ac.uk/}
 * @author    Chris Fryer <c.j.fryer@lse.ac.uk>
 */
class block_alma extends block_base {

    function init(){
        $this->blockname    = get_class($this);
        $this->title        = get_string('pluginname', $this->blockname);
        $this->content_type = BLOCK_TYPE_TEXT;
    }
    function has_config() { // Globally-configured
        return true;
    }
    function get_content() {
        if ($this->content !== null) {
            return $this->content;
        }
        $this->content = new stdClass();
        $this->content->text = '';
        // see renderer.php
        $renderer = $this->page->get_renderer($this->blockname);

        $this->content->text .= $renderer->search_form();
        $this->content->text .= $renderer->get_spinner();

        $this->content->footer = '';

        $this->page->requires->yui_module('moodle-block_alma-loans',
                                          'M.block_alma.loans.init');

        $requiredstrings = array('activeitem',  'activeitems',
                                 'overdueitem', 'overdueitems',
                                 'pluginname');
        $this->page->requires->strings_for_js($requiredstrings,
                                              $this->blockname);
        return $this->content;
    }
}
