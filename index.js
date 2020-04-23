
require('./css/app.scss');

const $ = require('jquery');
global.$ = global.jQuery = $;
window.PerfectScrollbar = require('perfect-scrollbar').default;
window.Swal = require('sweetalert2').default;
window.moment = require('moment');
window.toastr = require('toastr');

require('bootstrap');
require('datatables.net-bs4');
require('datatables.net-fixedcolumns-bs4');
require('datatables.net-fixedheader-bs4');

require('gasparesganga-jquery-loading-overlay');
window.Sticky = require('sticky-js');
require('./templates/metronic/mt3/js/scripts.bundle');

require('bootstrap-datepicker');
require('select2') ;

require('jquery-validation');
require('jquery-validation/dist/additional-methods');

window.Dropzone = require('dropzone');
Dropzone.autoDiscover = false;

window.App = {
    blockUI : function(target, message, noMessage){
        $.LoadingOverlay('show');
    },
    unblockUI : function(target){
        $.LoadingOverlay('hide')

    },
    initDatepicker: function ($scope){
        $scope = $scope || $('body');
        $scope.find('.widget-datepicker').each(function (index) {
            let changes = $(this).data('dp-defines');
            let definedBy = $(this).data('dp-defined');

            if(changes !== undefined){
                $(this).on('change', function(){
                    let $changes= $('#'+changes);
                    $changes.val('').trigger('change');
                    $changes.datepicker('setStartDate', App.getStartDateForDefiner($(this)));
                });
            }

            if($(this).hasClass('future-disabled')){
                $(this).datepicker({
                    format: 'M/dd/yyyy',
                    endDate: new Date()
                })
            }else{
                let startDate = definedBy !== undefined ? App.getStartDateForDefiner($('#'+definedBy)) : null;
                $(this).datepicker({
                    format: 'M/dd/yyyy',
                    startDate: startDate
                })
            }

        });
    },
    initDateTimePicker: function ($scope){
        $scope = $scope || $('body');
        $scope.find('.widget-datetimepicker').each(function (index) {
            let changes = $(this).data('dp-defines');
            let definedBy = $(this).data('dp-defined');

            if(changes !== undefined){
                $(this).on('change', function(){
                    let $changes= $('#'+changes);
                    $changes.val('').trigger('change');
                    $changes.datetimepicker('setStartDate', App.getStartDateTimeForDefiner($(this)));
                });
            }
            let startDate, endDate = null;
            if($(this).hasClass('future-disabled')){
                endDate = new Date();
            }
            else if($(this).hasClass('past-disabled')){
                startDate = new Date();
            }else{
                let $definedBy = $('#'+definedBy);
                startDate = definedBy !== undefined ? App.getStartDateTimeForDefiner($definedBy) : null;
            }
            $(this).datetimepicker({
                format: 'M/dd/yyyy hh:ii',
                endDate: endDate,
                startDate: startDate
            })

        });
    },
    getStartDateForDefiner: function(definerCmp){
        let checkInDate = moment(definerCmp.val(), 'MMM/DD/YYYY');
        checkInDate.add('1','days');
        return checkInDate.format('MMM/DD/YYYY');
    },
    getStartDateTimeForDefiner: function(definerCmp){
        let checkInDate = moment(definerCmp.val(), 'MMM/DD/YYYY hh:ii');
        checkInDate.add('1','hours');
        return checkInDate.format('MMM/DD/YYYY hh:ii');
    },
    initDropdown: function ($scope){
        $scope = $scope || $('body');
        $scope.find('.select2').each(function (i) {
            $(this).select2({
                width: '100%',
                clear: true,
                placeholder: $(this).attr('placeholder'),
                disabled: $(this).attr('readonly') === 'readonly'
            });
        });
    },

    initTooltips: function ($scope){
        $scope = $scope || $('body');
        $('[data-toggle="tooltip"]', $scope).tooltip();
        $('.do-tooltip', $scope).tooltip();
    },
    initComponents: function ($scope) {
        $scope = $scope ? $scope : $('body');
        App.initDatepicker($scope);
        App.initDateTimePicker($scope);
        App.initDropdown($scope);
        App.initTooltips($scope);
    },
};
App.initComponents();

require('./js/crud');

