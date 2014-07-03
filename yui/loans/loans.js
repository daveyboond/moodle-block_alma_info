/**
 * TODO: take a look at wwwroot/repository/filepicker.js
 */
YUI.add('moodle-block_alma-loans', function(Y) {

    M.block_alma = M.block_alma || {}

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

        sync: function(action, options, callback) {
            //~ Y.log('options: ' + options);
            //~ Y.log('callback: ' + callback);
            if (action == 'read') {
                Y.io(M.cfg.wwwroot+'/blocks/alma/loans.php', { // TODO: put this in an attribute
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
                parsedResponse = Y.JSON.parse(response);
                // Is this all items on loan, or just the first?
                return (Array(parsedResponse.item_loans.item_loan));
            }
            this.fire('error', {
                type : 'parse',
                error : 'No data in the response'
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

        panel : new M.core.dialogue({
            draggable    : true,
            headerContent: M.util.get_string('pluginname','block_alma'),
            bodyContent  : '<div id="almaloanstable">',
            centered     : true,
            width        : '650px',
            modal        : true,
            visible      : false
        }),

        renewLoans: function(loanids) {
            // TODO : get this function to renew loans
            //      : add subscribers to the ModelList's events
        },

        init: function() {
            table = this.table;
            table.data.load(function(){
                table.render('#almaloanstable');
                }
            );
            this.panel.addButton({
                label: 'Renew',
                context: M.block_alma.loans,
                action: 'renewLoans'
            });
            Y.one('#almastatus').on('click', this.panel.show, this.panel);
        }

/*
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

            var almastatus = Y.Node.create('<div />');
            activeHTML = (this.active > 1)
                       ? M.util.get_string('activeitems', 'block_alma', this.active)
                       : M.util.get_string('activeitem', 'block_alma', this.active);
            activediv = Y.Node.create(activeHTML);
            activediv.addClass('alma_active');
            almastatus.appendChild(activediv);

            if (this.overdue > 0) {
                overdueHTML = (this.overdue > 1)
                            ? M.util.get_string('overdueitems', 'block_alma', this.overdue)
                            : M.util.get_string('overdueitem', 'block_alma', this.overdue);
                overduediv = Y.Node.create(overdueHTML);
                overduediv.addClass('alma_overdue');
                almastatus.appendChild(overduediv);
            }

            Y.one('#almastatus').replace(almastatus);
            almastatus.set('id', 'almastatus');

            this.table.render('#almaloanstable');
            almastatus.on('click', this.popup.show, this.popup);

        }*/
    };
}, '@VERSION@', {
    requires: ['moodle-core-notification-dialogue', 'node', 'io', 'model-list', 'datatable']
});
