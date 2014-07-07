/**
 * TODO: take a look at wwwroot/repository/filepicker.js
 */
YUI.add('moodle-block_alma-loans', function(Y) {

    M.block_alma = M.block_alma || {}

    M.block_alma.AlmaLoanItem = Y.Base.create('almaLoanItem', Y.Model, [], {
        // methods (none)
        idAttribute : 'loanId'
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

        uri   : M.cfg.wwwroot+'/blocks/alma/loans.php',

        model : M.block_alma.AlmaLoanItem,

        sync: function(action, options, callback) {
            if (action == 'read') {
                Y.io(this.uri, {
                    data: build_querystring({
                        sesskey : M.cfg.sesskey,
                        action  : 'getloans'
                    }),
                    on: {
                        success: function(id, o) {
                            Y.log('AJAX call complete: ' + o.responseText,
                                  'info', 'moodle-block_alma-loans');
                            callback(null, o.responseText);
                        },
                        failure: function(id, o) {
                            Y.log('AJAX call failed: ' + o.responseText,
                                  'info', 'moodle-block_alma-loans');
                        }
                    }
                });
            }
        },
        parse : function(response) {
            if (response) {
                var parsedResponse = Y.JSON.parse(response);

                if (parsedResponse.errorsExist == 'false') {

                    return parsedResponse.result.search_web_service.searchResult.item_loans;
                }
            }
            this.fire('error', {
                type : 'parse',
                error : parsedResponse.errorList.error.errorMessage // What other errors might we encounter?
            });
        }
    });

    M.block_alma.loans = {

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
                        Y.log(o.value);
                        switch (o.data.loanStatus) {
                            case 'Active' :
                                o.className += 'alma_active';
                                break;
                            case 'Overdue' :
                                o.className += 'alma_overdue';
                                break;
                        }
                        return Y.Date.format(Y.Date.parse(o.value), {format : "%d %b %Y"} );
                    }
                },
                {
                    key  : 'renewalStatus',
                    label: 'Renewal status',
                }
            ],
            data : new M.block_alma.AlmaLoanItemsList(),
            caption: "Your loans",
            summary: "Table showing items you have on loan from the library",
            sortable: true,
            scrollable: true
        }),

        panel : new M.core.dialogue({
            draggable    : true,
            headerContent: M.util.get_string('pluginname','block_alma'),
            bodyContent  : '<div id="almaloanstable">',
            centered     : true,
            width        : '640px',
            modal        : true,
            visible      : false,
        }),

        renewLoans: function() {

            var table = this.table;
            var loanIds = table.data.get('loanId');

            var renewresults = Y.io(table.data.uri, {
                data: build_querystring({
                    sesskey : M.cfg.sesskey,
                    action  : 'renew',
                    loanids : loanIds.toString()
                }),
                on: {
                    success: function(id, o) {
                        Y.log('AJAX call complete: ' + o.responseText,
                              'info', 'moodle-block_alma-loans');
                        var response = Y.JSON.parse(o.responseText);
                        if (response.errorsExist == 'false') {
                            for (i=0; i < response.result.loan_renew.length; i++) {
                                var loanrenew = response.result.loan_renew[i];
                                var matchingLoanItem = table.getRecord(loanrenew['loanId']);
                                Y.log(loanrenew);
                                if (loanrenew.Success == 'false') {
                                    matchingLoanItem.set('renewalStatus', 'Not renewed: ' + loanrenew.FailureReason);
                                } else {
                                    matchingLoanItem.set('renewalStatus', 'Renewed');
                                }
                            }
                        } else {
                            // errors exist
                        }

                    },
                    failure: function(id, o) {
                        Y.log('AJAX call failed: ' + o.responseText,
                              'info', 'moodle-block_alma-loans');
                    }
                }
            });
        },

        displayRenewResult : function(response) {
        },

        init: function() {
            var table = this.table;
            try {
                table.data.load( function() {
                    table.render('#almaloanstable');
                });
            } catch (e) {
                Y.one('#almastatus').set('text', e.getMessage());
            }
            table.data.on('error', function(e) {
                Y.one('#almastatus').replace('<div>' + e.error +'</div>');
            });
            this.panel.addButton({
                label: 'Renew',
                context: M.block_alma.loans,
                action: 'renewLoans'
            });
            table.data.after('dataChange', function(e) {
                Y.log('Table data changed!');
            });
            table.data.after('load', function(e) {
                try {
                    var activeItems = e.target.filter(function(model) {
                        return model.get('loanStatus') === 'Active';
                    });
                    var overdueItems = e.target.filter(function(model) {
                        return model.get('loanStatus') === 'Overdue';
                    });
                    if (overdueItems.length) {
                        var template = (overdueItems.length == 1) ? 'overdueitem' : 'overdueitems';
                        var statustext = M.util.get_string(template, 'block_alma', overdueItems.length)
                        Y.one('#almastatus').set('text', statustext);
                        Y.one('#almastatus').addClass('alma_overdue');
                    } else {
                        var template = (activeItems.length == 1) ? 'activeitem' : 'activeitems';
                        var statustext = M.util.get_string(template, 'block_alma', activeItems.length)
                        Y.one('#almastatus').set('text', statustext);
                        Y.one('#almastatus').addClass('alma_active');
                    }
                } catch (e) {
                    Y.log(e.message);
                }
            });
            Y.one('#almastatus').on('click', this.panel.show, this.panel);
        }
    };
}, '@VERSION@', {
    requires: ['moodle-core-notification-dialogue', 'node', 'io', 'model-list', 'datatable', 'datatype-date-format', 'datatype-date-parse']
});
