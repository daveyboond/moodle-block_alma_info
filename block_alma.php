<?php
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
        
        $loadingparams = array(
            'id' => 'almaprogress',
            'src' => $this->page->theme->pix_url('i/loading_small', 'moodle'),
            'alt' => get_string('loading', 'block_alma'),
        );
        $loading = html_writer::empty_tag('img', $loadingparams);

        $this->content = new stdClass();
        $this->content->text = $loading;
        $this->content->footer = '';

        $this->page->requires->yui_module('moodle-block_alma-loans',
                                          'M.block_alma.loans.init',
                                          array(sesskey())
                                          );

        $requiredstrings = array('activeitem',  'activeitems',
                                 'overdueitem', 'overdueitems',
                                 'pluginname');
        $this->page->requires->strings_for_js($requiredstrings,
                                              $this->blockname);
        return $this->content;
    }
}

