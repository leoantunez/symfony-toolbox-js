function GroupManagerComponent() {
    let $scope = $('.crud-group-scope');
    this.$scope = $scope;
    this.$newRecordBtn = $scope.find('.btn-new-record');
    this.$formModal = $('#modal-pax-form');
    this.$filterModal = $('#filter-form');
    this.$formFilter = this.$filterModal.find('form');
    this.$detailsModal = $('#modal-details');
    this.$simpleFilter = $('#simple_filter');
    this.$btnSaveModal = this.$formModal.find('#btn-save');
    this.$formatExport = $scope.find('.groups-format-export');
    this.$table = $scope.find('.crud-table');
}

GroupManagerComponent.prototype = {
    $scope: undefined,
    $newRecordBtn: undefined,
    $formModal: undefined,
    $filterModal: undefined,
    $formFilter: undefined,
    $detailsModal: undefined,
    $simpleFilter: undefined,
    $btnSaveModal: undefined,
    $table: undefined,
    $formatExport: undefined,
    dt: undefined,
    isChained: false,
    lockGroupLoading: false,
    $tableGroups: $('#crud-table-groups'),
    $tableClients: $('#crud-group-pax'),
    $tableClientsContainer: $('#table-clients-container'),
    $noDataContainer: $('.no-data-container'),
    $dropzoneForm: $('#groups-upload-dropzone'),
    $dropzoneErrorContainer: $('#dz-error-container'),
    $btnClearLog: $('#clear-log'),

    constructor: GroupManagerComponent,

    init: function () {
        if (this.$scope.length) {
            this.initListeners();
            this.initClientsDataTable();
            this.initDropzone();
        }
    },

    loadFormModal: function (url) {
        let _this = this;
        $.LoadingOverlay("show")
        $('.modal-body', _this.$formModal).load(url, function (res) {
            $.LoadingOverlay("hide")
            App.initComponents(_this.$formModal.find('.modal-body'));
            let rowData = _this.$tableGroups.DataTable().rows('.selected').data();
            _this.$formModal.find('#group_pax_groupInstance').val(rowData[0][0]).trigger('change');
            _this.$formModal.trigger('api_form_modal_loaded');
            _this.$formModal.modal('show');
        });
    },

    loadModal: function ($modal, url) {
        let _this = this;
        $.LoadingOverlay("show")
        $('.modal-body', $modal).load(url, function (res) {
            $.LoadingOverlay("hide")
            App.initComponents($modal.find('.modal-body'));
            $modal.trigger('api_form_modal_loaded');
            $modal.modal('show');
        });
    },

    initListeners: function () {
        let _this = this;
        _this.$tableGroups.on('row_selected', function (evt, tableInstance) {
            _this.toggleNoDataPlaceholder(false);
            let rowData = tableInstance.rows('.selected').data();
            _this.$filterModal.find('#group_filter_group').val(rowData[0][0]);
            _this.dt.ajax.reload();
        });
        _this.$tableGroups.on('row_deselected', function (evt, tableInstance) {
            _this.toggleNoDataPlaceholder(true);
            _this.clearClientsTable();
        });
        _this.$tableGroups.on('record_removed', function (evt, tableInstance) {
            _this.clearClientsTable();
        });
        _this.$newRecordBtn.click(function () {
            if (_this.validateGroupSelection('Please select a group to add clients.')) {
                _this.loadFormModal($(this).data('load-url'))
            }
        });
        _this.$formatExport.click(function (evt) {
            evt.preventDefault();
            if (_this.validateGroupSelection('Please select a group to export its details.')) {
                let filterData = _this.$formFilter.serialize();
                let start = _this.dt.page.info().start;
                let length = _this.dt.page.info().length;
                let url = $(this).attr('href') + '?' + filterData + '&start=' + start + '&length=' + length;
                window.open(url);
            }

        });
        _this.$simpleFilter.submit(function (evt) {
            if (_this.$formFilter.length > 0) {
                evt.preventDefault();
                let targetBinding = _this.$simpleFilter.data('binded');
                $('#' + targetBinding, _this.$formFilter).val($('#simple_filter_search').val());
                _this.dt.ajax.reload();
                return false;
            }
        });
        _this.$formModal.delegate('input', 'keypress', function (e) {
            let $form = _this.$formModal.find('form');
            if (e.which === 13) {
                if ($form.valid()) {
                    $form.trigger('submit')
                }
            }
        });
        _this.$table.delegate('.view-record-btn', 'click', function (e) {
            _this.loadModal(_this.$detailsModal, $(this).data('load-url'));
            e.preventDefault();
            e.stopPropagation();
        });
        _this.$table.delegate('.edit-record-btn', 'click', function (e) {
            _this.loadFormModal($(this).data('load-url'));
            e.preventDefault();
            e.stopPropagation();
        });
        _this.$table.delegate('.remove-record-btn', 'click', function (e) {
            _this.removeRecord($(this));
            e.preventDefault();
            e.stopPropagation();
        });
        _this.$formModal.on('api_form_modal_loaded', function (evt) {
            let $form = _this.$formModal.find('form');
            $form.validate({
                ignore: ":not(:visible),:disabled",
                errorElement: "span",
                errorPlacement: function (error, element) {
                    error.addClass("mt-2 mb-2 text-danger validation-error");
                    if (element.prop("type") === "checkbox") {
                        error.insertAfter(element.parent("label"));
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
                    $.LoadingOverlay("show")
                    $.ajax(
                        {
                            url: $(form).prop('action'),
                            method: 'post',
                            data: $(form).serialize(),
                            success: function (res) {
                                _this.dt.ajax.reload();
                                _this.$formModal.modal('hide');
                                toastr.success('The client data has been processed.');
                                _this.$tableClients.trigger('crud_form_processed', [$(form).prop('name')]);
                            },
                            error: function (res) {
                                $('.modal-body', _this.$formModal).html(res.responseText);
                                App.initComponents(_this.$formModal.find('.modal-body'));
                                _this.$formModal.trigger('api_form_modal_loaded');
                            },
                            complete: function () {
                                $.LoadingOverlay("hide")
                            }
                        }
                    );
                    return false;
                }

            });
            _this.$clientDataContainer = $('.new-client-container', _this.$formModal);
        });
        _this.$btnSaveModal.click(function () {
            let $form = _this.$formModal.find('form');
            if ($form.valid()) {
                $form.trigger('submit')
            }
        });
        _this.$btnClearLog.click(function (evt) {
            _this.$dropzoneErrorContainer.find('ul').html('');
        })
    },

    initDropzone: function () {
        let _this = this;
        _this.$dropzoneForm.dropzone({
            url: _this.$dropzoneForm.attr('action'),
            init: function () {
                this.on("error", function (dz, errorMessage) {
                    _this.$dropzoneErrorContainer.find('ul').append(errorMessage);
                    _this.$dropzoneErrorContainer.removeClass('d-none');
                });
                this.on("queuecomplete", function (dz, errorMessage) {
                    _this.clearGroupsTable();
                });
            }
        });
    },

    validateGroupSelection: function (failMessage) {
        let _this = this;
        let rowData = _this.$tableGroups.DataTable().rows('.selected').data();
        if (rowData.length === 0) {
            Swal.fire({
                title: 'Warning',
                text: failMessage,
                icon: "warning"
            });
            return false
        }
        return true;
    },

    removeRecord: function (el) {
        let _this = this;

        Swal.fire({
            title: el.data('confirmation-msg-title'),
            text: el.data('confirmation-msg-desc'),
            icon: "warning",
            showCancelButton: true,
            confirmButtonText: el.data('confirmation-msg-btn-ok'),
            cancelButtonText: el.data('confirmation-msg-btn-cancel')
        }).then(function (confirmed) {
            if (confirmed.value) {
                $.LoadingOverlay("show")
                $.ajax({
                    url: el.data('action-url'),
                    method: 'delete',
                    data: {
                        token: el.data('token')
                    }
                }).done(function (res) {
                    _this.dt.ajax.reload();
                    toastr.success('The record has been removed.')
                }).fail(function (res) {
                    Swal.fire('Oops!', res.responseJSON.msg, 'error');
                }).always(function () {
                    $.LoadingOverlay("hide")
                })
            }
        });
    },

    clearClientsTable: function () {
        let _this = this;
        _this.$filterModal.find('#group_filter_group').val('');
        _this.dt.clear().draw();
    },

    clearGroupsTable: function () {
        let _this = this;
        _this.clearClientsTable();
        _this.$tableGroups.DataTable().ajax.reload();
    },

    initClientsDataTable: function () {
        let _this = this;
        let orderingColumns = _this.$tableClients.data('ordering-columns');
        _this.$tableClients.on('processing.dt', function (e, settings, processing) {
            if (_this.$tableClientsContainer.hasClass('d-none')){
                return;
            }
            $('.dataTables_processing').css('display', 'none');
            if (processing) {
                $(_this.$scope.find('.kt-portlet__body')).LoadingOverlay("show");
            } else {
                $(_this.$scope.find('.kt-portlet__body')).LoadingOverlay("hide", true);
            }
        });
        this.dt = this.$tableClients.DataTable({
            deferLoading: 0,
            scrollX: true,
            scrollCollapse: true,
            autoWidth: true,
            fixedColumns: {
                leftColumns: 2,
            },
            dom: '<"top">rt<"bottom-tbar"<"row p-2"<"col-lg-4"l><"col-lg-8"p>>>',
            paging: true,
            lengthChange: true,
            searching: true,
            info: true,
            language: {
                'zeroRecords': _this.$tableClients.data('empty-table-msg') ? _this.$tableClients.data('empty-table-msg') : 'No data available in table',
                'emptyTable': 'No data available in table'
            },
            columnDefs: [
                {"orderable": false, "targets": 0},
                {"orderable": false, "targets": orderingColumns.length}
            ],
            ajax: {
                url: _this.$tableClients.data('source'),
                method: 'GET',
                data: function (d) {
                    let filterData = _this.$formFilter.serializeArray();
                    if (_this.$formFilter) {
                        let $lengthControl = _this.$formFilter.find('.data-length');
                        let $startControl = _this.$formFilter.find('.data-start');
                        $lengthControl.val(d.length).trigger('change');
                        $startControl.val(d.start).trigger('change');
                    }
                    filterData.push({name: 'length', value: d.length});
                    filterData.push({name: 'start', value: d.start});

                    if (d.order.length > 0) {
                        filterData.push({name: 'order_column', value: orderingColumns[d.order[0].column]});
                        filterData.push({name: 'order_dir', value: d.order[0].dir});
                    } else {

                        filterData.push({name: 'order_column', value: orderingColumns[0]});
                        filterData.push({name: 'order_dir', value: 'desc'});
                    }
                    return filterData;
                },

            },
            ordering: _this.$tableClients.data('ordering-enabled'),
            order: [[0]],
            processing: true,
            serverSide: true,
            drawCallback: function (oSettings) {
                _this.$tableClients.find('[data-toggle="tooltip"]').tooltip();
                _this.$tableClients.find('[data-toggle="kt-popover"]').popover();
            },

        });
    },

    toggleNoDataPlaceholder: function (shouldDisplay) {
        let _this = this;
        if(shouldDisplay === true){
            _this.$tableClientsContainer.addClass('d-none');
            _this.$noDataContainer.removeClass('d-none');
        } else{
            _this.$tableClientsContainer.removeClass('d-none');
            _this.$noDataContainer.addClass('d-none');
        }
    }

};

(function () {
    (new GroupManagerComponent()).init();
})(jQuery, window, document);

window.onload = function () {
    document.getElementById('group_filter_group').value = '';
}