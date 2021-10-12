
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
            let format = $(this).data('dpFormat') ? $(this).data('dpFormat') : 'M/dd/yyyy';

            if(changes !== undefined){
                $(this).on('change', function(){
                    let $changes= $('#'+changes);
                    $changes.val('').trigger('change');
                    $changes.datepicker('setStartDate', App.getStartDateForDefiner($(this)));
                });
            }

            if($(this).hasClass('future-disabled')){
                $(this).datepicker({
                    format: format,
                    endDate: new Date()
                })
            }else{
                let startDate = definedBy !== undefined ? App.getStartDateForDefiner($('#'+definedBy)) : null;
                $(this).datepicker({
                    format: format,
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
        const format = definerCmp.data('dpMomentFormat') ? definerCmp.data('dpMomentFormat') : 'MMM/DD/YYYY';
        let checkInDate = moment(definerCmp.val(), format);
        checkInDate.add('1','days');
        return checkInDate.format(format);
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

    appendForm: function ($triggerEl, cb, protoName, list) {
        list = list ? list : $($triggerEl.attr('data-list'));
        let counter = list.data('widget-counter') | list.children().length;
        let widgetTags = list.attr('data-widget-tags');
        protoName = protoName ? protoName : '__name__';
        if (!counter) {
            counter = list.children().length;
        }
        let newWidget = $triggerEl.data('prototype');
        let re = new RegExp(protoName, "g");
        newWidget = newWidget.replace(re, counter);
        widgetTags = widgetTags.replace(re, counter);
        counter++;
        list.data('widget-counter', counter);
        let newElem = $(widgetTags).html(newWidget);
        let counterClass = 'odd';
        if (counter % 2 === 0) {
            counterClass = 'even';
        }
        newElem.addClass(counterClass).addClass('d-none');
        if ($triggerEl.data('policy') === 'insert-before') {
            $triggerEl.parents('li').before(newElem)
        } else {
            newElem.appendTo(list);
            newElem.removeClass('d-none')
        }
        cb($(newElem))
    },

    initValidation: function ($form, handlerCb, successCb, failureCb) {
        let _this = this;
        $form.validate({
            ignore: ":not(:visible),:disabled",
            errorElement: "span",
            errorPlacement: function (error, element) {
                error.addClass("mt-2 mb-2 text-danger validation-error");
                if (element.prop("type") === "checkbox") {
                    error.insertAfter(element.parents(".checkbox"));
                } else if (element.prop("type") === "radio") {
                    error.insertAfter(element.parents(".icheck"));
                } else if (element.is('select') && (element.hasClass('select2') || element.hasClass('select2-ph'))) {
                    error.insertAfter(element.siblings(".select2"));
                } else if (element.is('textarea') && element.hasClass('lc-ckeditor')) {
                    error.insertAfter(element.siblings(".ck-editor"));
                } else if (element.is('input') && element.parents('.input-group').length > 0) {
                    error.insertAfter(element.parents('.input-group'));
                } else {
                    error.insertAfter(element);
                }
            },
            highlight: function (element, errorClass, validClass) {
                $(element).addClass("is-invalid").removeClass("is-valid");
            },
            unhighlight: function (element, errorClass, validClass) {
                $(element).addClass("is-valid").removeClass("is-invalid");
            },
            submitHandler: function (form) {
                if (handlerCb) {
                    handlerCb(form)
                } else {
                    $.LoadingOverlay("show");
                    $.ajax(
                        {
                            url: $(form).prop('action'),
                            method: 'post',
                            data: $(form).serialize(),
                            success: function (res) {
                                successCb(res);
                            },
                            error: function (res) {
                                failureCb(res);
                            },
                            complete: function () {
                                $.LoadingOverlay("hide");
                            }
                        }
                    );
                }
                return false;
            }

        });
    },
};
App.initComponents();

require('./js/crud');

