﻿; (function () {

    var imageSelector = angular.module('sfImageSelector', ['sfLibrariesService', 'sfDates', 'sfInfiniteScroll']);

    var selectors = angular.module('selectors');

    var LIST_MODE = 'list',
        UPLOAD_MODE = 'upload',
        UPLOADING_MODE = 'uploading',
        INSERT_MODE = 'insert';

    var modes = [];
    modes[LIST_MODE] = {
        name: LIST_MODE,
        title: 'Select image',
        okButton: {
            title: 'Done',
            raise: 'DoneSelecting'
        },
        cancelButton: {
            title: 'Cancel',
            raise: 'CancelSelect'
        }
    };

    modes[UPLOAD_MODE] = {
        name: UPLOAD_MODE,
        title: 'Upload image',
        okButton: {
            title: 'Upload',
            raise: 'UploadImage'
        },
        cancelButton: {
            title: 'Cancel',
            raise: 'CancelUpload'
        }
    };

    modes[UPLOADING_MODE] = {
        name: UPLOADING_MODE,
        title: 'Upload image',
        cancelButton: {
            title: 'Cancel',
            raise: 'CancelUploading'
        }
    };

    modes[INSERT_MODE] = {
        name: INSERT_MODE,
        title: 'Image',
        okButton: {
            title: 'Done',
            raise: 'InsertImage'
        },
        cancelButton: {
            title: 'Cancel',
            raise: 'CancelInsert'
        }
    };

    /*
     * Provides functionality for the list mode of the image selector.
     */
    imageSelector.controller('sfImageSelectorListCtrl', ['$scope', 'sfImageService', function ($scope, sfImageService) {

        /*
         * Loads items through the sfImageService. For paging, take is default
         * one as defined in the sfImageService.query function; skip is calculated
         * by the current number of listItems present in the $scope.listItems property
         * as we are doing infinite scrolling.
         */
        $scope.loadItems = function () {

            var queryOptions = {
                skip: $scope.listItems.length,
                filter: {
                    name: $scope.listFilter
                }
            };

            sfImageService.query(queryOptions)
                .then(
                    // success
                    function (result) {
                        $scope.listItems = $scope.listItems.concat(result.data.Items);
                    },
                    // failure
                    function (reason) {

                    }
                );
        };

        /*
         * The predefined filters present in the user interface. Can have following
         * values
         * null - No filtering, controller should be in upload mode
         * 'recent' - List should display recent items (both images and albums)
         * 'mine' - List should display my items (both images and albums)
         * 'all' - List should display all items (both images and albums)
         */
        $scope.listFilter = null;

        /*
         * The array of all list items that are to be displayed in the list.
         */
        $scope.listItems = [];


        /*
         * Represents the item that is currently selected in the list.
         */
        $scope.selectedItem = null;

        /*
         * Event handler which handles the event of a user selecting an item.
         */
        $scope.select = function (item) {
            $scope.selectedItem = item;
        };

        // Event handler fired by the button for selecting a file manually.
        $scope.selectFile = function () {
            $scope.$emit('doSelectFile');
        };

        /*
         * Watches the listFilter property. If the list property is set to 
         */
        $scope.$watch('listFilter', function (newValue, oldValue) {
            if (newValue) {
                $scope.loadItems();
            } else {
                $scope.items = [];
            }
        });

        /*
         * Subscribe to the ok command of the list mode so that we can handle
         * it.
         */
        $scope.$on(modes[LIST_MODE].okButton.raise, function () {
            // When ok command for the list mode is fired, we need
            // to rise the ImageSelected event so that it can be 
            // handled up the chain. Also send the selected item
            // as an event argument.
            $scope.$emit('ImageSelected', $scope.selectedItem);
        });

        /*
         * Subscribe to the cancel command of the list mode so that we can handle
         * it.
         */
        $scope.$on(modes[LIST_MODE].cancelButton.raise, function () {
            // When cancel command for list mode is fired, we need
            // to rise the Cancel event so that it can be handled 
            // up the chain
            $scope.$emit('Cancel');
        });

    }]);

    /*
     * Provides functionality for the upload mode of the image selector.
     */
    imageSelector.controller('sfImageSelectorUploadCtrl', ['$scope', 'sfImageService', function ($scope, sfImageService) {

        $scope.completedPercent = 0;

        // represents the HTML File object to be uploaded
        $scope.file = null;

        // subscribe to the event that starts upload
        $scope.$on(modes[UPLOAD_MODE].okButton.raise, function (ev, args) {

            // set the active mode to uploading
            $scope.$parent.activeMode = modes[UPLOADING_MODE];

            sfImageService.upload($scope.file).then(
                // success
                function (data) {
                    $scope.$parent.image = data.ContentItem;
                },
                // failure
                function (error) {
                    // TODO: handle the upload errors here
                },
                // notification
                function (completion) {
                    $scope.completedPercent = completion;
                });
        });

        // subscribes to the event that cancels upload
        $scope.$on(modes[UPLOAD_MODE].cancelButton.raise, function (ev, args) {
            // set the file to upload to null
            $scope.$parent.file = null;
            // go back to the list mode
            $scope.$parent.activeMode = modes[LIST_MODE];
        });

        $scope.$parent.$watch('file', function (newValue, oldValue) {
            $scope.file = newValue;
        });

    }]);

    /*
     * Provides functionality for the insert mode of the image selector.
     */
    imageSelector.controller('sfImageSelectorInsertCtrl', ['$scope', '$interpolate', function ($scope, $interpolate) {

        $scope.image = {};

        $scope.insertOptions = {
            alignment: 'none'
        };

        $scope.$parent.$watch('image', function (newValue, oldValue) {
            if (newValue) {
                $scope.image = newValue;
            }
        });

        // subscribe to the event that inserts an image
        $scope.$on(modes[INSERT_MODE].okButton.raise, function (ev, args) {

            var markup = '<img src="{{ MediaUrl }}" />';
            markup = $interpolate(markup)($scope.image);
            $scope.$emit('imageSelected', markup);

        });

    }]);

    /*
     * This directive represents the Sitefinity Image Selector.
     */
    imageSelector.directive('sfImageSelector', ['serverContext', function (serverContext) {

        var imageSelectorController = function ($scope) {

            $scope.activeMode = modes[LIST_MODE];

            $scope.$emit('needsImage', function (e) {
                
            });
            
            /*
             * Represents the image user has selected. This selection
             * can happen in several ways (clicks on the image, upload has completed
             * successfully...). The image is a JSON representation of Sitefinity
             * Image (based on Content type).
             */
            $scope.image = null;

            /*
             * Represents a file that has been selected for uploading
             * but has not yet been uploaded.
             */
            $scope.file = null;

            /*
             * If the file field has been changed to something else than null,
             * it means we have a pending upload and we should switch the mode
             * of the ImageSelector to upload mode.
             */
            $scope.$watch('file', function (newValue, oldValue) {
                if (newValue) {
                    $scope.activeMode = modes[UPLOAD_MODE];
                }
            });

            /*
             * Subscribe to the ImageSelected event which could be fired by any
             * of the child scopes. Set the $scope.image property to the argument
             * that was sent [newly selected image] and switch the active mode to
             * insert.
             */
            $scope.$on('ImageSelected', function (ev, arg) {
                $scope.image = arg;
                $scope.activeMode = modes[INSERT_MODE];
            });

            /*
             * If the image field has been changed to something else
             * than null, it means user has selected an image and we should
             * switch the mode of the ImageSelector to insert mode.
             */
            //$scope.$watch('image', function (newValue, oldValue) {
            //    if (newValue) {
            //        $scope.activeMode = modes[INSERT_MODE];
            //    }
            //});

            /*
             * Watches the active mode in order to be able to emit an event
             * when mode has changed.
             */
            //$scope.$watch('activeMode', function (newValue, oldValue) {
            //    $scope.$emit('modeChanged', newValue);
            //});

        };

        return {
            restrict: 'E',
            templateUrl: serverContext.getEmbeddedResourceUrl('Telerik.Sitefinity.Frontend', 'Selectors/image-selector.html'),
            controller: imageSelectorController
        };

    }]);

    /*
     * Image Selector Modal directive wraps the Image selector in a modal dialog. It is a 
     * convenience thin wrapper which can be used to open the Image Selector in a modal dialog.
     */
    imageSelector.directive('sfImageSelectorModal', ['$compile', '$parse', 'serverContext', function ($compile, $parse, serverContext) {

        var link = function ($scope, element, attributes) {

            var selectorTemplate = serverContext.getEmbeddedResourceUrl('Telerik.Sitefinity.Frontend', 'Selectors/image-selector-modal.html'),
                directiveMarkup = '<div modal existing-scope="true" window-class="sf-image-selector-dlg" template-url="' + selectorTemplate + '" size="lg"></div>',
                modalDirective = $compile(directiveMarkup)($scope),
                editMarkup;

            // appends the compiled modal directive 
            var modalElement = $(element).append(modalDirective);

            $scope.$on('needsImage', function (ev, arg) {
                arg(editMarkup);
            });

            // Represents the current mode of the Image Selector
            $scope.mode = modes[LIST_MODE];

            // Subscribes to the modeChanged event which is fired by the [child] ImageSelector
            // controller
            $scope.$on('modeChanged', function (ev, newMode) {
                $scope.mode = newMode;
            });

            //$scope.$on('imageSelected', function (ev, args) {
            //    $scope.$modalInstance.result.then(function (e) {
            //        $(element).trigger('imageSelected', e);
            //    });
            //    $scope.$modalInstance.close(args);
            //});

            /*
             * Subscribes to the "Cancel" command which could be fired by any
             * of the child scopes down the hierarchy. Once this command is fired
             * the directive will close the itself [the modal].
             */
            $scope.$on('Cancel', function (ev, args) {
                $scope.$modalInstance.close();
            });

            /*
             * Opens the image selector modal dialog.
             */
            $scope.open = function (markup) {
                editMarkup = markup;
                var dialog = angular.element(modalElement).scope().$openModalDialog();
            };

            $scope.command = function (cmd) {
                $scope.$broadcast(cmd);
            };

        };

        return {
            restrict: 'E',
            link: link
        };

    }]);
    

    /*
     * This directive enhances the standard HTML5 file upload (input element) with additional functionality needed
     * by the ImageSelector. This directive is not to be reused outside of ImageSelector as it has a very narrow
     * functionality and design.
     */
    imageSelector.directive('sfImageSelectorUploader', function () {

        var link = function ($scope, element, attributes) {
            
            // Handles the change event (a file has been selected) of the [input type="file"]
            $(element).change(function (ev) {
                $scope.$apply(function () {
                    // TODO: add validation here if there are no files
                    $scope.file = element.get(0).files[0];
                });
            });

            // Open the [input type="file"] choose file dialog. This event could be triggered by
            // various actions in the other controllers.
            $scope.$on('doSelectFile', function () {
                // call the click event in a timeout to avoid digest loop
                setTimeout(function () {
                    $(element).click();
                }, 0);
            });

        };

        return {
            restrict: 'A',
            link: link
        };

    });

}());