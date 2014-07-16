<?php
/**
 * Renderer for component 'block_alma'
 *
 * @package   block_alma
 * @copyright 2014 London School of Economics {@link http://www.lse.ac.uk/}
 * @author    Chris Fryer <c.j.fryer@lse.ac.uk>
 */
class block_alma_renderer extends plugin_renderer_base {

    function search_form() {
        $content = '';
        // The search form
        $content .= html_writer::start_tag('form', array(
            'method' => 'GET',
            'action' => get_config('block_alma', 'primourl'),
        ));
        // The search input
        $content .= html_writer::empty_tag('input', array(
            'id'   => 'block_alma_primo_search_input',
            'type' => 'text',
            'name' => 'vl(freeText0)',
        ));
        // Hidden View ID
        $content .= html_writer::empty_tag('input', array(
            'type'  => 'hidden',
            'name'  => 'vid',
            'value' => get_config('block_alma', 'primovuid'),
        ));
        // Hidden Institution Code
        $content .= html_writer::empty_tag('input', array(
            'type'  => 'hidden',
            'name'  => 'institution',
            'value' => get_config('block_alma', 'institutioncode'),
        ));
        $content .= html_writer::empty_tag('input', array(
            'type'  => 'hidden',
            'name'  => 'ct',
            'value' => 'search',
        ));
        $content .= html_writer::empty_tag('input', array(
            'type'  => 'hidden',
            'name'  => 'fn',
            'value' => 'search',
        ));
        $content .= html_writer::empty_tag('input', array(
            'type'  => 'hidden',
            'name'  => 'InitialSearch',
            'value' => 'true',
        ));
        $content .= html_writer::empty_tag('input', array(
            'type'  => 'image',
            'src'   => $this->page->theme->pix_url('i/search', 'moodle'),
        ));
        $content .= html_writer::end_tag('form');
        return $content;
    }
    function get_spinner() {
        $content  = html_writer::start_tag('div', array('id' => 'almastatus'));
        $content .= html_writer::empty_tag('img', array(
            'src' => $this->page->theme->pix_url('i/loading_small', 'moodle'),
            'alt' => get_string('loading', 'block_alma'),
        ));
        $content .= html_writer::end_tag('div');
        return $content;
    }
}
