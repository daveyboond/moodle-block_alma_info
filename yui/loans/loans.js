/**
 * TODO: take a look at wwwroot/repository/filepicker.js
 */
YUI.add('moodle-block_alma-loans', function(Y) {

    M.block_alma = M.block_alma || {};
    M.block_alma.loans = {

        active: 0,                      // Count of active loan items
        overdue: 0,                     // Count of overdue loan items
        loansuri: M.cfg.wwwroot+'/blocks/alma/loans.php',
        response: null,
        blockname: M.util.get_string('pluginname','block_alma'),
        popup: null,
        error: null,

        init: function() {
            var params = {
                sesskey : M.cfg.sesskey,
                };
            Y.on('io:end', this.setBlockText, this);
            this.getLoans(params, this.loansuri);
        },
        getLoans: function(params, uri) {
            var xhr = Y.io(uri, {
                data: build_querystring(params),
                context: this,
                on: {
                    success: function(id, o) {
                        Y.log('AJAX call complete: ' + o.responseText,
                              'info', 'moodle-block_alma-loans');
                        try {
                            this.response = Y.JSON.parse(o.responseText);
                        } catch (e) {
                            this.error = e;
                        }
                        if (this.response['error']) { // Moodle has erred
                            this.error = response['error'];
                        }
                        if (this.response['errorsExist']) { // Alma has erred
                            this.error = response.errorList.error.errorMessage;
                        }
                    },
                    failure: function(id, o) {
                        Y.log('AJAX call failed: ' + o.responseText,
                              'info', 'moodle-block_alma-loans');
                        if (o.statusText != 'abort') {
                            if (o.statusText !== undefined) {
                                this.error = o.statusText;
                            }
                        }
                    },
                }
            });
        },
        setBlockText: function() {
            var response = this.response;

            for (var i in response.item_loans) {
                if (response.item_loans[i].loanStatus == 'Active') {
                    this.active++;
                }
                if (response.item_loans[i].loanStatus == 'Overdue') {
                    this.overdue++;
                }
            }

            var loanstatus = Y.Node.create('<div />');
            activeHTML = (this.active > 1)
                       ? M.util.get_string('activeitems', 'block_alma', this.active)
                       : M.util.get_string('activeitem', 'block_alma', this.active);
            activediv = Y.Node.create(activeHTML);
            activediv.addClass('alma_active');
            loanstatus.appendChild(activediv);

            if (this.overdue > 0) {
                overdueHTML = (this.overdue > 1)
                            ? M.util.get_string('overdueitems', 'block_alma', this.overdue)
                            : M.util.get_string('overdueitem', 'block_alma', this.overdue);
                overduediv = Y.Node.create(overdueHTML);
                overduediv.addClass('alma_overdue');
                loanstatus.appendChild(overduediv);
            }

            Y.one('#almaprogress').replace(loanstatus);
            loanstatus.set('id', 'loanstatus');

            this.popup = new M.core.dialogue({
                draggable    : true,
                headerContent: this.blockname,
                bodyContent  : this.getPopupText(),
                centered     : true,
                width        : '650px',
                modal        : true,
                visible      : false
            });
            this.popup.addButton({
                label: 'Renew',
                context: M.block_alma.loans,
                action: 'renewLoans'
            });
            loanstatus.on('click', this.popup.show, this.popup);
        },
        renewLoans: function() {
            // TODO : get this function to renew loans and set the bodyContent
            // (or some of its child nodes) to new values.
            // @see http://yuilibrary.com/yui/docs/api/classes/Panel.html
            this.popup.set('bodyContent', 'Only Users Lose Drugs');
        },
        getPopupText: function() {
            response = this.response;

            popupcontent = Y.Node.create('<table />');
            popupcontent.addClass('alma_table');

            for (var i in response.item_loans) {
                row = Y.Node.create('<tr />');

                cellTitle = Y.Node.create('<td>' + response.item_loans[i].title + '</td>');
                cellDuedate = Y.Node.create('<td>' + response.item_loans[i].dueDate + '</td>');
                cellDuedate.addClass('alma_cell_duedate');

                if (response.item_loans[i].loanStatus == 'Active') {
                    cellDuedate.addClass('alma_active');
                }
                if (response.item_loans[i].loanStatus == 'Overdue') {
                    cellDuedate.addClass('alma_overdue');
                }

                row.appendChild(cellTitle);
                row.appendChild(cellDuedate);
                popupcontent.appendChild(row);
            }
            return popupcontent;
        }
    };
}, '@VERSION@', {
    requires: ['node', 'io']
});
