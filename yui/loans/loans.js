/**
 * TODO: take a look at wwwroot/repository/filepicker.js
 */
YUI.add('moodle-block_alma-loans', function(Y) {

    M.block_alma = M.block_alma || {};
    M.block_alma.loans = {

        active: 0,                      // Count of active loan items
        overdue: 0,                     // Count of overdue loan items
        uri: M.cfg.wwwroot+'/blocks/alma/loans.php',
        response: null,
        blockname: M.util.get_string('pluginname','block_alma'),

        init: function() {
            var params = {
                sesskey : M.cfg.sesskey,
                };
            this.getLoans(params);
        },
        getLoans: function(params) {
            var xhr = Y.io(this.uri, {
                data: build_querystring(params),
                context: this,
                on: {
                    success: function(id, o) {
                        Y.log('AJAX call complete: ' + o.responseText,
                              'info', 'moodle-block_alma-loans');
                        try {
                            var response = Y.JSON.parse(o.responseText);
                        } catch (e) {
                            errormsg = '<div>' + e + '</div>';
                            Y.one('#almaprogress').replace(errormsg);
                        }
                        this.setText(response);
                    },
                    failure: function(id, o) {
                        if (o.statusText != 'abort') {
                            if (o.statusText !== undefined) {
                                var errormsg = '<div>Error: '+o.statusText+'</div>';
                                Y.one('#almaprogress').replace(errormsg);
                            }
                        }
                    }
                }
            });
        },
        setText: function(response) {
            var errormsg;
            if (response['error']) { // Moodle has erred
                errormsg = response['error'];
            }
            if (response['errorsExist']) { // Alma has erred
                errormsg = response.errorList.error.errorMessage;
            }
            if (errormsg) {
                Y.one('#almaprogress').replace('<div>'+errormsg+'</div>');
                return;
            }

            popupcontent = Y.Node.create('<table />');
            popupcontent.addClass('alma_table');

            for (var i in response.item_loans) {
                row = Y.Node.create('<tr />');

                cellTitle = Y.Node.create('<td>' + response.item_loans[i].title + '</td>');
                cellDuedate = Y.Node.create('<td>' + response.item_loans[i].dueDate + '</td>');
                cellDuedate.addClass('alma_cell_duedate');

                if (response.item_loans[i].loanStatus == 'Active') {
                    cellDuedate.addClass('alma_active');
                    this.active++;
                }
                if (response.item_loans[i].loanStatus == 'Overdue') {
                    cellDuedate.addClass('alma_overdue');
                    this.overdue++;
                }

                row.appendChild(cellTitle);
                row.appendChild(cellDuedate);
                popupcontent.appendChild(row);
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

            popup = new M.core.dialogue({
                draggable    : true,
                headerContent: '<span id="popup">' + this.blockname + '</span>',
                bodyContent  : popupcontent,
                centered     : true,
                width        : '650px',
                modal        : true,
                visible      : false
            });

            loanstatus.on('click', function() {
                popup.show();
            });
        }
    };
}, '@VERSION@', {
    requires: ['node', 'io']
});
