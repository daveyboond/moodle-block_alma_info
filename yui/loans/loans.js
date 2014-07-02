/**
 * TODO: take a look at wwwroot/repository/filepicker.js
 */
YUI.add('moodle-block_alma-loans', function(Y) {

    M.block_alma = M.block_alma || {};

    M.block_alma.AlmaLoanItem = Y.Base.create('almaLoanItem', Y.Model, [], {
        // methods (none)
    }, {
        ATTRS: {
            loanId : {},
            loanStatus : {},
            dueDate : {},
            processStatus : {},
            description : {},
            locationCode : {},
            itemBarCode : {},
            title : {},
            author : {},
            callNumber : {},
            loanDate : {},
            locationName : {},
            itemPolicy : {},
            loanFine : {}
        }
    });

    M.block_alma.AlmaLoanItemsList = Y.Base.create('almaLoanItemsList', Y.ModelList, [], {

        model : M.block_alma.AlmaLoanItem,

        sync: function (action, options, callback) {

            if (action == 'read') {
                data = M.block_alma.loans.almaRequest('getloans');
                callback(null, data);
            }
        },
        parse : function (response) {
            if (response) {
                return (Array(response.item_loans.item_loan));
            }
            this.fire('error', {
                type : 'parse',
                error : 'No data in the response'
            });
        }
    });

    M.block_alma.loans = {

        active: 0,                      // Count of active loan items
        overdue: 0,                     // Count of overdue loan items
        uri: M.cfg.wwwroot+'/blocks/alma/loans.php',
        response: null,
        blockname: M.util.get_string('pluginname','block_alma'),
        popup: null,
        error: null,

        table : new Y.DataTable({
            recordType: M.block_alma.AlmaLoanItem,
            columns : [
                {
                    key : 'title',
                    label : 'Title'
                },
                {
                    key :'dueDate',
                    label : 'Due',
                    formatter : function(o) {
                        switch (o.data.loanStatus) {
                            case 'Active' :
                                o.className += 'active';
                                break;
                            case 'Overdue' :
                                o.className += 'overdue';
                                break;
                        }
                    }
                }
            ],
            data: new M.block_alma.AlmaLoanItemsList(),
            caption: "Your loans",
            summary: "Table showing items you have on loan from the library",
            sortable: true
        }),

        init: function() {
            //var loans = this.almaRequest('getloans', this.setBlockText);
            this.table.data.load();
        },
        almaRequest : function(action) {
            var request = Y.io(this.uri, {
                data: build_querystring({
                    sesskey : M.cfg.sesskey,
                    action  : action
                }),
                context: this,
                on: {
                    success: function(id, o) {
                        Y.log('AJAX call complete: ' + o.responseText,
                              'info', 'moodle-block_alma-loans');
                        this.responseText = o.responseText;
                        try {
                            var response = Y.JSON.parse(o.responseText);
                            if (response['error']) { // Moodle has erred
                                this.error = response['error'];
                            }
                            if (response['errorsExist']) { // Alma has erred
                                this.error = response.errorList.error.errorMessage;
                            }
                            this.response = response;
                        } catch (e) {
                            this.error = e;
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
                bodyContent  : '<div id="almaloanstable">', //Y.one('#almaloanstable'),
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
            this.table.render('#almaloanstable');
            loanstatus.on('click', this.popup.show, this.popup);
        },
        renewLoans: function(loanids) {
            // TODO : get this function to renew loans and set the bodyContent
            // (or some of its child nodes) to new values.
            // @see http://yuilibrary.com/yui/docs/api/classes/Panel.html
            // this.popup.set('bodyContent', 'Only Users Lose Drugs');
        }
    };
}, '@VERSION@', {
    requires: ['node', 'io', 'model-list', 'datatable']
});
