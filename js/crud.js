function CrudManager($scope, config) {
    this.$newRecordBtn = $scope.find('.btn-new-record');
    this.$formModal = $('#modal-form');
    this.$filterModal = $('#filter-form');
    this.$formFilter = this.$filterModal.find('form');
    this.$detailsModal = $('#modal-details');
    this.$simpleFilter = $('#simple_filter');
    this.$btnSaveModal = this.$formModal.find('#btn-save');
    this.$formatExport = $scope.find('.format-export');
    this.$table = $scope.find('.crud-table');

    if (config !== undefined && config.isChained) {
        this.isChained = true;
    }
}

CrudManager.prototype = {
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
    appendBtn: '.crud-append-btn',
    relativeAppendBtn: '.crud-relative-append-btn',
    collectionRemoveBtn: '.collection-remove-item',
    collectionItem: '.collection-item',
    dt: undefined,
    chainedManager: undefined,
    isChained: false,

    constructor: CrudManager,

    init: function () {
        this.initListeners();
        this.initDataTable();
        return this;
    },

    loadFormModal: function (url) {
        let _this = this;
        $.LoadingOverlay("show")
        $('.modal-body', _this.$formModal).load(url, function (res) {
            $.LoadingOverlay("hide")
            App.initComponents(_this.$formModal.find('.modal-body'));
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
        _this.$newRecordBtn.click(function () {
            _this.loadFormModal($(this).data('load-url'))
        });
        _this.$formatExport.click(function (evt) {
            evt.preventDefault();
            let filterData = _this.$formFilter.serialize();
            let start = _this.dt.page.info().start;
            let length = _this.dt.page.info().length;
            let url = $(this).attr('href') + '?' + filterData + '&start=' + start + '&length=' + length;
            window.open(url);
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
        _this.$formFilter.delegate('input', 'keypress', function (e) {
            e.preventDefault();
            let $form = _this.$formModal.find('form');
            if (e.which === 13) {
                _this.dt.ajax.reload();
                _this.$filterModal.modal('hide');
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
                                toastr.success('The record has been processed.')
                                $('body').trigger('crud_form_processed', [$(form).prop('name')]);
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
        _this.$filterModal.find('#btn-apply-filter').click(function (evt) {
            _this.dt.ajax.reload();
            _this.$filterModal.modal('hide');
        });
        _this.$filterModal.find('#btn-reset-filter').click(function (evt) {
            _this.$filterModal.find('select').each(function (i) {
                $(this).val(null).trigger('change');
            })
        });
        _this.$formModal.delegate(_this.appendBtn, 'click', function (e) {
            App.appendForm($(this), function ($el) {
                App.initComponents($el);
                $el.trigger('section-appended');
            }, $(this).data('prototypeName'));
        });
        _this.$formModal.delegate(_this.relativeAppendBtn, 'click', function (e) {
            App.appendForm($(this), function ($el) {
                App.initComponents($el);
            }, $(this).data('prototype-name'), $(this).closest('.collection-container').find('.collection-list'));
        });
        _this.$formModal.delegate(_this.collectionRemoveBtn, 'click', function (e) {
            let item = $(this);
            Swal.fire({
                title: el.data('confirmation-msg-title'),
                text: el.data('confirmation-msg-desc'),
                icon: "warning",
                showCancelButton: true,
                confirmButtonText: el.data('confirmation-msg-btn-ok'),
                cancelButtonText: el.data('confirmation-msg-btn-cancel')
            }).then(function (confirmed) {
                if (confirmed.value) {
                    _this.removeCollectionItem(item);
                }
            });

        });
    },

    removeCollectionItem: function ($el) {
        let _this = this;
        $el.closest(_this.collectionItem).addClass('d-none').remove();
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
                    _this.$table.trigger('record_removed', [_this.dt]);
                    toastr.success('The record has been removed.')
                }).fail(function (res) {
                    if (res.responseJSON.msg !== undefined) {
                        Swal.fire('Oops!', res.responseJSON.msg, 'error');
                    } else {
                        Swal.fire('Oops!', 'Something went wrong, please try again later.', 'error');
                    }
                }).always(function () {
                    $.LoadingOverlay("hide")
                })
            }
        });
    },

    initDataTable: function () {
        let _this = this;
        _this.$table.on('processing.dt', function (e, settings, processing) {
            $('.dataTables_processing').css('display', 'none');
            if (processing) {
                $(e.currentTarget).LoadingOverlay("show");
            } else {
                $(e.currentTarget).LoadingOverlay("hide", true);
            }
        });
        let orderingColumns = _this.$table.data('ordering-columns');
        _this.dt = _this.$table.DataTable({
            dom: '<"top">rt<"bottom-tbar"<"row p-2"<"col-lg-4"l><"col-lg-8"p>>>',
            paging: true,
            lengthChange: true,
            searching: true,
            info: true,
            language: {
                'zeroRecords': _this.$table.data('empty-table-msg') ? _this.$table.data('empty-table-msg') : 'No data available in table'
            },
            autoWidth: false,
            columnDefs: [
                {"orderable": false, "targets": 0},
                {"orderable": false, "targets": orderingColumns.length}
            ],
            ajax: {
                url: _this.$table.data('source'),
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
                dataSrc: function (response) {
                    // loadUrls = [];
                    // response.data.forEach(function (r) {
                    //     loadUrls.push(r.pop());
                    // });
                    return response.data;
                }
            },
            ordering: _this.$table.data('ordering-enabled'),
            order: [[0]],
            processing: true,
            serverSide: true,
            drawCallback: function (oSettings) {
                _this.$table.find('[data-toggle="tooltip"]').tooltip();
            },

        });
        if (_this.$table.hasClass('table-select-tool')) {
            _this.$table.on('click', 'tr', function () {
                if ($(this).hasClass('selected')) {
                    $(this).removeClass('selected');
                    _this.$table.trigger('row_deselected', [_this.dt]);
                } else {
                    _this.$table.find('tr.selected').removeClass('selected');
                    $(this).addClass('selected');
                    _this.$table.trigger('row_selected', [_this.dt]);
                }
            });

        }

    },

    loadClientData: function (clientId) {
        let _this = this;
        let url = _this.$newRecordBtn.data('load-client-url');
        url = url.replace('_0_', clientId);
        _this.$clientDataContainer.LoadingOverlay("show");
        $('.modal-body', _this.$formModal).load(url, function (res) {
            _this.$clientDataContainer.LoadingOverlay("hide");
            App.initComponents(_this.$formModal.find('.modal-body'));
            _this.$formModal.trigger('api_form_modal_loaded');
            _this.$formModal.modal('show');
            // _this.disableClientForm();
        });
    },

    enableClientForm: function () {
        let _this = this;
        _this.$clientDataContainer.find('input,select').each(function (i) {
            $(this).prop('readonly', false);
            $(this).val('').trigger('change');
            if ($(this)[0].nodeName.toLowerCase() === 'select') {
                $(this).select2({
                    disabled: false
                });
            }
        })
    },

    disableClientForm: function () {
        let _this = this;
        _this.$clientDataContainer.find('input,select').each(function (i) {
            $(this).prop('readonly', true);
            if ($(this)[0].nodeName.toLowerCase() === 'select') {
                $(this).select2({
                    disabled: true
                });
            }
        })
    },

};

(function () {
    const defaultScope = '.crud-scope';
    $scope = $(defaultScope);
    if ( $scope.length ) {
        (new CrudManager($scope)).init();
    }

})(jQuery, window, document);

module.exports = CrudManager;
