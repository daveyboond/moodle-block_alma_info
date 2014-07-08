YUI.add('moodle-block_alma-loans', function(Y) {

    M.block_alma = M.block_alma || {}

    M.block_alma.AlmaLoanItem = Y.Base.create('almaLoanItem', Y.Model, [], {

        idAttribute : 'loanId'

    }, {
        ATTRS: {
            loanId : {},
            loanStatus : {},
            dueDate : {},
            processStatus : {},
            description : {},
            locationCode : {},
            itemBarcode : {},
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
                        action  : options.action //'getloans'
                    }),
                    on: {
                        success: function(id, o) {
                            callback(null, o.responseText);
                        },
                        failure: function(id, o) {
                            callback(o.status + ': ' + o.statusText);
                        }
                    }
                });
            }
        },
        parse : function(response) {

            var parseError;
            if (response) {
                try {
                    var parsedResponse = Y.JSON.parse(response);
                    if (parsedResponse.errorsExist == 'true') { // Yes, 'true' is a string here
                        parseError = parsedResponse.errorList.error.errorMessage;// Alma error
                    } else if (parsedResponse.error != null) {
                        parseError = parsedResponse.error; // Moodle error    
                    } else {
                        return parsedResponse.result.search_web_service.searchResult.item_loans;
                    }
                } catch (e) {
                    parseError = e.toString();
                }
            } else {
                parseError = 'No data received';                
            }
            this.fire('error', {
                type  : 'parse',
                error : parseError
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
                        var response = Y.JSON.parse(o.responseText);
                        if (response.errorsExist == 'false') {

                            table.data.load({ action : 'getloans'}, function() { // refresh the datatable with new due dates

                                for (var i=0; i < response.result.loan_renew.length; i++) {
                                    var loanrenew = response.result.loan_renew[i];
                                    var matchingLoanItem = table.getRecord(loanrenew['loanId']);
                                    if (loanrenew.Success == 'false') {
                                        matchingLoanItem.set('renewalStatus', 'Not renewed: ' + loanrenew.FailureReason);
                                    } else {
                                        matchingLoanItem.set('renewalStatus', 'Renewed');
                                    }
                                }
                            });
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

        init: function() {

            var table = this.table;
            var panel = this.panel;

            table.data.load({ action : 'getloans'} , function() {
                var activeItems = table.data.filter(function(model) {
                    return model.get('loanStatus') === 'Active';
                });
                var overdueItems = table.data.filter(function(model) {
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
                table.render('#almaloanstable');
                Y.one('#almastatus').on('click', panel.show, panel);
            });
            this.panel.addButton({
                label: 'Renew',
                context: M.block_alma.loans,
                action: 'renewLoans'
            });
            table.data.after('dataChange', function(e) {
                Y.log('Table data changed!');
            });
            // If we run into any trouble, let the user know
            table.data.on('error', function(e) {
                almaerror = Y.Node.create('<div>Error: ' + e.error + '</div>');
                almaerror.set('id', 'almaerror');
                // Trash the #almastatus div altogether to prevent this getting overwritten later
                Y.one('#almastatus').replace(almaerror);
            });
        }
    };
}, '@VERSION@', {
    requires: ['moodle-core-notification-dialogue', 'node', 'io', 'model-list', 'datatable', 'datatype-date-format', 'datatype-date-parse']
});
