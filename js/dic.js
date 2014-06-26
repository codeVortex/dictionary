// EventNamespace closure
var EventNamespace = (function(){
    "use strict";
    var that = EventNamespace || {},
        // private variable KEYCODES
        KEYCODES = {
        VK_RETURN: 13,
        VK_ESCAPE: 27
    },
        customFilterSubmit = function (searchToken, searchFilter) {
            ajaxOperations
                .getWords(searchToken, searchFilter)
                .then(DomManipulations.wordList.populate, viewers.failDialog);
        }
    ;
    // the public EventNamespace API
    that.keyHandlers = {
        dismissViewers: function (event) {
            if (event.which === KEYCODES.VK_ESCAPE) {
                viewers.resetWordEdit();
                viewers.hideElement($('#wordEdit'));
                viewers.resetWordView();
                viewers.hideElement($('#wordView'));
            }
        },
        customFilter: function (event) {
            if ($(this).is('#searchToken') && event.which === KEYCODES.VK_RETURN) {
                var searchToken = $('#searchToken').val(),
                    searchFilter = $('#searchFilter').val();
                customFilterSubmit(searchToken, searchFilter);
            }
        }
    };
    that.clickHandlers = {
        wordViewTrigger: function (event) {
            event.stopPropagation();
            $(".selected").removeClass("selected");
            var wordSpelling = $(this).parent().addClass("selected").text();
            viewers.showWordView(event, wordSpelling);
        },
        wordView: function (event) {
            $(".selected").removeClass("selected");
            viewers.hideElement($(this));
            event.stopPropagation();
        },
        wordOperations: function (event) {
            event.preventDefault();  // prevent the jumping around caused by clicking to a # link
            event.stopPropagation();
            if (this.id === 'newWord') {
                $('#wordEdit-operation').val('insert');
                viewers.showWordEdit($('.selected').length === 1 ? $('.selected').text() : null);
            }
        },
        filters: function (event) {
            event.preventDefault();
            var target = $(this);
            DomManipulations.filters.customFilterClear();
            if (target.is('#allFilter')) {
                ajaxOperations.getWords().then(DomManipulations.wordList.populate, viewers.failDialog);
            }
            else if (target.is('#customFilter button')) {
                var searchToken = $('#searchToken').val(),
                    searchFilter = $('#searchFilter').val();
                customFilterSubmit(searchToken, searchFilter);
            }
            else if (target.is('#wordFilters a')) {
                var letterVal = target.text();
                ajaxOperations.getWords(letterVal, "starts").then(DomManipulations.wordList.populate, viewers.failDialog);
            }
        },
        wordEdit: function ( event ) {
            event.preventDefault(); // prevent actual form submission
            event.stopPropagation();
            if ($(this).is('#wordEdit-discarder')) {
                viewers.resetWordEdit();
                viewers.hideElement($('#wordEdit'));
            }
            else if ($(this).hasClass('adderBtn')) {
                if ($(this).prev().is('#wordEdit-extraInfo-defs')) {
                    viewers.createDefUnit();
                }
                else if ($(this).prev().is('#wordEdit-extraInfo-syns')) {
                    viewers.createSynUnit();
                }
            }
            else if ($(this).hasClass('wordEdit-unit-remover')) {
                $(this).closest('.removable').remove();
            }
            else {
                throw new Error('Unhandled click target: ' + this.constructor.toString());
            }
        }
        // end of click handlers
    };
    that.dragHandlers = {
        start : function (event, ui) {
            $('.selected').removeClass('selected');
            $(this).filter('.viewerTrigger').css('display', 'none');
            $('#wordView').fadeOut('fast');
            ui.helper.addClass('selected');
        }
    };
    that.dropHandler = function (event, ui) {
        var draggable = ui.draggable;
        switch ($(this).attr('id')) {
        case 'delWord':
            var wordSp = draggable.text();
            ajaxOperations.deleteWords(wordSp).then(
                function (data) {
                dic.removeWord(wordSp);
                viewers.dialog({
                    title : data.success ? "Deletion successful" : "Deletion failed",
                    message : data.message
                });
                draggable.addClass('removable');
            },
                function (data) {
                viewers.dialog({
                    title : "Delete operation failed",
                    message : data.responseText.message
                });
            }).done(function () {
                if (draggable.is('.removable')) {
                    draggable.remove();
                }
            });
            event.stopPropagation();
            break;
        case 'updWord':
            $('#wordEdit-operation').val('update');
            viewers.showWordEdit( draggable.text() );
            break;
        default:
            throw new Error('Unexpected droppable!');
        }
    };
    that.resetHandlers = {
        wordEdit: function () {
            viewers.resetWordEdit();
        }
    };
    that.submitHandlers = {
        wordEdit: function (event) {
            event.preventDefault();
            var word = {}, 
                promise = null, 
                wordEdit = $('#wordEdit'),
                operation = document.getElementById('wordEdit-operation').value;
            // create json word object representation from the input fields
            word.sp = wordEdit.find('#wordEdit-basicInfo-sp').val();
            word.lang = wordEdit.find('#wordEdit-basicInfo-lang').val();
            word.defs = [];
            wordEdit.find('#wordEdit-extraInfo-defs li').each(
                function() {
                    word.defs.push({
                        'body': $(this).find("textarea[id^='extraInfo-defs-body']").val(),
                        'lang': $(this).find("select[id^='extraInfo-defs-lang']").val()
                    });
                }
            );
            word.syns = [];
            wordEdit.find('#wordEdit-extraInfo-syns li').each(
                function() {
                    word.syns.push({
                        'sp': $(this).find("input[id^='extraInfo-syns-sp']").val(),
                        'lang': $(this).find("select[id^='extraInfo-syns-lang']").val()
                    });
                }
            );
            switch (operation) {
                case 'insert': 
                    promise = ajaxOperations.insertWord( JSON.stringify(word) );
                    break;
                case 'update':
                    promise = ajaxOperations.updateWord( JSON.stringify(word) );
                    break;
                default: throw new Error('Unexpected selected operation');
            }
            promise.done( function (data) {
                viewers.dialog({
                    title : operation + (data.success ? " successful" : " failed"),
                    message : data.message
                });
            });
            promise.fail( function (data) {
                viewers.dialog({
                    title: operation + (data.success ? " successful" : " failed"),
                    message: data.message
                });
            });
            viewers.resetWordEdit();
            viewers.hideElement(wordEdit);
        }
    };
    return that;
}());

var DomManipulations = (function () {
    "use strict";
    var that = DomManipulations || {};  // the returnable object of current closure
    
    // Configure operation buttons
    /* Add droppable functionality to word operations (except for "New word") */
    var dropOptions = {
        tolerance : "intersect", accept : "#wordList li", activeClass : 'active',
        hoverClass : 'hovered', drop : EventNamespace.dropHandler
    };
    $('#wordOperations')
    .on('click', 'a', EventNamespace.clickHandlers.wordOperations)
    .find('a').not('#newWord').droppable(dropOptions); // assign and init drop targets
    
    // Configure filters
    that.filters = (function() {
        var filtersInstance = {};    // the returnable object of current closure
        
        filtersInstance.customFilterClear = function () {
            $('#wordFilters > li:first-child input[type=text]').val("");
        };
        
        // register the filter event handlers
        $('#wordFilters')
        .on('keyup', '#searchToken', EventNamespace.keyHandlers.customFilter)
        .on('click', '#customFilter button, a', EventNamespace.clickHandlers.filters)
        .on('click', '#allFilter', EventNamespace.clickHandlers.filters);
        
        /**
         * Initialize the simple (single-letter) filters
         */
        var letterFilters = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split('');
        letterFilters.forEach(function (letterVal) {
            $('<li>')
            .append(
                $('<a>')
                .attr({
                    href : "#",
                    title : "Words starting with " + letterVal.toUpperCase()
                })
                .text(letterVal)
            )
            .appendTo($('#wordFilters'));
        });
                
        return filtersInstance;
    }());
    
    that.wordList = {
        /**
        * Populates the ul#wordList with the newly retrieved words from the server
        * @param {json} response Properly formatted json data that comprise the retrieved words 
        */
        populate: function (response) {
            if (!response || !(response.hasOwnProperty('success')) || !response.success) {
                viewers.dialog({title : "Retrieval Request Failed", message : response.message});
                return;
            }
            /* Add draggable ability to word list elements (powered by JQuery UI) */
            var dragOptions = {
                containment : "main",
                helper : "original",
                revert : true,
                revertDuration : 150,
                iframeFix: true,
                opacity: .85,
                start : EventNamespace.dragHandlers.start
            };

            $('#wordList').empty(); // ensures an empty #wordList
            dic.empty(); // ensures an empty dictionary
            if (Array.isArray(response.data)) {
                response.data.forEach(
                    function (wordData) {
                        // create the Word objects and add them to current Dictionary
                        dic.addWord(wordData);
                        // create the li nodes and append them to wordList
                        $('<li>')
                        .text(wordData.sp)
                        .attr('id', 'word-' + wordData.sp)
                        .append($('<div>').addClass('viewerTrigger'))
                        .draggable(dragOptions)
                        .appendTo($('#wordList'));
                });
            }

            $('#wordList').on('click','.viewerTrigger', EventNamespace.clickHandlers.wordViewTrigger);

            // updates the #resultsMsg element which displays info about the number of loaded words
            var totalWords = dic.countWords();
            var resultsMessage = (totalWords === 0) ? "No words to display." : (totalWords + (totalWords > 1 ? " words " : " word ") + "retrieved.");
            $('#resultsMsg').text(resultsMessage);

            // Creates a self-disposable dialog that informs for the success of the operation
            viewers.dialog({title : "Retrieval succeeded", message : response.message});
        }
    };
    
    return that;
}());

var ajaxOperations = (function(){
    "use strict";
    return {
        /* Retrieves the currently registered, that is used in definitions, languages from the server */
        getLanguages: function () {
            return $.getJSON("php/controller.php", {
                op : "get",
                target : "language"
            }).promise();
        },

        /**
         * Initiates an Ajax request using a GET method to retrieve a filtered set of words from the server.
         * @param {string} searchToken Contains the token to be looked for in the server-side data store.
         * @param {string} searchFilter Expresses the filter to be applied in a natural language representation.
         * Acceptable values for searchFilter are any of the following strings: "starts", "ends", "contains", "equals"
         */
        getWords: function (searchToken, searchFilter) {
            // validate the arguments
            searchToken = (typeof searchToken === "string") ? searchToken.trim() : ""; // minimal sanitization of the string
            var acceptableFilters = ['starts', 'ends', 'contains', 'equals'];
            searchFilter = ((typeof searchFilter !== "string") || (acceptableFilters.indexOf(searchFilter) === -1)) ? "" : searchFilter;

            // prepare the parametric data for the get request
            var operationalData = {
                op : "get",
                target : "word",
                token : searchToken,
                filter : searchFilter
            };

            // execute the get request and return and deferred object to act upon subsequently by the caller
            return $.getJSON("php/controller.php", operationalData);
        },
    
        /**
         * Delete a chosen word
         * @param {string} deletable A string containing the word (its main spelling) to be deleted from the server (and local UI of course)
         */
        deleteWords: function (deletable) {
            if (!deletable)
                throw new Error('Deletable argument cannot be null');
            var validated = null; // null or string which bears the validated deletable(s)
            if (Array.isArray(deletable)) {
                deletable.forEach(function (element) {
                    if (typeof element === 'string' && !/^\s*$/.test(deletable)) {
                        validated.push(element);
                    }
                });
            } else if ((typeof deletable === 'string') && !/^\s*$/.test(deletable)) {
                validated = deletable;
            } else {
                throw new Error('Deletable argument must be a non-empty string or array.');
            }
            // request server to delete the word(s) from its storage
            return $.getJSON("php/controller.php", {
                op : "delete",
                target : validated
            }).promise();
        },
        
        /**
         * Insert a new word entry into the Dictionary 
         * @param {object} insertable The stringified json representation of word data
         */
        insertWord: function ( insertable ) {
            var deferred = 
                $.ajax({
                    url: "php/controller.php?op=insert",
                    method: 'post',
                    dataType: 'json',
                    data: insertable
                });
            return deferred.promise();
        },
        
        /**
         * Updates an existing word on the backend Datastore
         * @param {object} updateabe The stringified json representation of word data
         */
        updateWord: function ( updateable ) {
            var deferred = 
                $.ajax({
                    url: "php/controller.php?op=update",
                    method: 'post',
                    dataType: 'json',
                    data: updateable
                });
            return deferred.promise();
        }
    };
}());

var viewers = (function () {
    "use strict";

    // private functions
    var that = {};
    
    /**
    * Creates a blank or populated synUnit {jquery object}.
    * @param {object} syn Optional arg of an object having the format {sp: 'string', lang: 'string'}
    * @returns {jQuery}
    */
    that.createSynUnit = function (syn) {
        var wordEditSyns = $('#wordEdit-extraInfo-syns'),
            newSynUnitId = wordEditSyns.children('li').length + 1;
        $('<li>')
        .append(
            $('<div>').append(
                $('<label>').attr('for', 'extraInfo-syns-sp-' + newSynUnitId).text('spelling'),
                $('#templates .wordEdit-sp').clone().attr('id','extraInfo-syns-sp-' + newSynUnitId).val( syn ? syn.sp : '' )
            ),
            $('<div>').append(
                $('<label>').attr('for', 'extraInfo-syns-lang-' + newSynUnitId).text('language'),
                $('#templates .wordEdit-lang').clone().attr('id','extraInfo-syns-lang-' + newSynUnitId).val( syn ? syn.lang : 'en' )
            ),
            $('#templates .wordEdit-unit-remover').clone()
        )
        .addClass('removable')
        .appendTo( wordEditSyns );
    };
    /**
    * Creates a blank or populated defUnit {jquery object}.
    * @param {array} def Optional arg of an object having the format {body: 'text', lang: 'lang_iso_code'}
    * @returns {jQuery}
    */
    that.createDefUnit = function (def) {
        var wordEditDefs = $('#wordEdit-extraInfo-defs'),
            newDefUnitId = wordEditDefs.children('li').length + 1;
        $('<li>')
        .append(
            $('<div>').append(
                $('<label>').attr('for', 'extraInfo-defs-body-' + newDefUnitId).text('definition body'),
                $('#templates .extraInfo-defs-body').clone().attr('id', 'extraInfo-defs-body-' + newDefUnitId).val( def ? def.body : '' )
            ),
            $('<div>').append(
                $('<label>').attr('for', 'extraInfo-defs-lang-' + newDefUnitId).text('language'),
                $('#templates .wordEdit-lang').clone().attr('id','extraInfo-defs-lang-' + newDefUnitId).val( def ? def.lang : 'en' )
            ),
            $('#templates .wordEdit-unit-remover').clone()
        )
        .addClass('removable')
        .appendTo( wordEditDefs );
    };
    /**
    *  Creates a dialog that is dismissed after a predetermined amount of time or upon a user-click
    *  @param options Argument object with the expected form: {dismissalDelay: int, animationDelay: int, title: String, message: String}
    */
    that.dialog = function (options) {
        // default settings
        var settings = {
            dismissalDelay : 2000, // duration being displayed (in ms)
            animationDelay : 500, // speed of the fade out effect (in ms)
            title : "Generic",
            message : "I serve no particular purpose apart from filling up the dialog with some unintelligible content."
        }, diag = null;
        // Merge the user supplied options with the default ones
        $.extend(settings, options);
        // Actual dialog creation
        diag = $('<div>')
            .addClass("dialog")
            .click(function () {$(this).remove();})
            .append(
                $('<h4>').text(settings.title),
                $('<p>').text(settings.message))
            .appendTo($('body'));
        // Set a timeout to dismiss the dialog
        setTimeout(function () {
            diag.fadeOut(settings.animationDelay, function () {$(this).remove();});
            }, settings.dismissalDelay);
    };
    /**
    * Displays a custom dialog for failed or erroneous requests
    * @param {plain object} data to provide to Displayer.dialog function to display a custom fail dialog
    */
    that.failDialog = function (data) {
        this.dialog({
            title : "Request failed",
            message : data.responseText.message
        });
    };
    /**
    * Display the selected word and all its relevant information in a separate div.
    * @param {Event} triggerEvent The event triggering the wordInfo display dialog (click event)
    * @param {string} wordSpelling The spelling of the retrievable word from the Dictionary
    */
    that.showWordView = function (triggerEvent, wordSpelling) {
        if (!wordSpelling) {throw new Error('wordSpelling arg must be defined');}
        var word = dic.getWord(wordSpelling), targetDefList = null, targetSynList = null;
        viewers.resetWordView();

        $('#wordView').removeClass('hidden')
            // apply a "fade in" effect for the wordView
            .fadeIn({"duration" : 250,"easing" : "swing"})
            // define the position of the element
            .position({
                my : "top",
                at : "left bottom",
                of : triggerEvent.target,
                collision : "flipfit",
                within : '#wordList'
            })
            // register the word's basicInfo
            .find('#wordView-basicInfo-sp').text(word.sp).end()
            .find('#wordView-basicInfo-lang').text(word.lang)
        ;
        // register the word's definitions
        if (word.hasOwnProperty('defs') && Array.isArray(word.defs) && word.defs.length > 0) {
            targetDefList = $('#wordView-extraInfo-defs ol');
            word.defs.forEach(function (value) {
                $('<li>').html(
                    value.body + ' <span class="lang">(' + value.lang + ')</span>'
                ).appendTo( targetDefList );
            });
        }
        else {
            $('<p>').text('(not found)').appendTo( '#wordView-extraInfo-defs' );
        }

        // register the word's synonyms
        if (word.hasOwnProperty('syns') && Array.isArray(word.syns) && word.syns.length > 0) {
            targetSynList = $('#wordView-extraInfo-syns ol');
            word.syns.forEach(function (value) {
            $('<li>').html(
                value.sp + ' <span class="lang">(' + value.lang + ')</span>'
            ).appendTo( targetSynList );
            });
        }
        else {
            $('<p>').text('(not found)').appendTo( '#wordView-extraInfo-syns' );
        }
    };
    /**
    * Provides a facility to edit an existing entry or create a new one.
    * If the sp argument is not null, it retrieves the word from the client-side dictionary
    * and loads its information in the edit form. If sp is null or no word can be retrieved from
    * the dictionary, it displays a blank word edit form.
    * @param {string} sp (Optional parameter) The spelling of an existing word.
    */
    that.showWordEdit = function (sp) {
        // case when sp argument is a valid string
        var wordObj = (sp && dic.containsWord(sp)) ? dic.getWord(sp) : null,
            wordEdit = $('#wordEdit');
        // clear previous wordEdit data
        that.resetWordEdit();

        wordEdit
            .slideToggle('fast')
            .position({my: 'center', at: 'bottom center', of: '#wordOperations', within: '#words'})
        ;

        if (wordObj !== null) {
            // tackle basicInfo data (it must exist since wordObj is not null)
            wordEdit
                .find('#wordEdit-basicInfo-sp').val(wordObj.sp).end()
                .find('#wordEdit-basicInfo-lang').val(wordObj.lang);
            
            // insert definition data (if exist)
            if (wordObj.defs && Array.isArray(wordObj.defs)) {
                wordObj.defs.forEach(function ( defObj ) {
                    that.createDefUnit( defObj );
                });
            }
            // insert synonyms data (if exist)
            if (wordObj.syns && Array.isArray(wordObj.syns)) {
                wordObj.syns.forEach ( function ( synObj ) {
                    that.createSynUnit( synObj );
                });
            }
        }
    };
    that.resetWordEdit = function () {
        $('#wordEdit')
        .find('.removable').remove().end()
        .find('.resettable').empty();
    };
    that.resetWordView = function () {
        $('#wordView')
        .find('#wordView-basicInfo-sp, #wordView-extraInfo ol').empty().end()
        .find('#wordView-basicInfo-lang').val('en').end()
        .find('p').remove();
    };
    that.hideElement = function (jQueryObject) {
        jQueryObject.fadeOut({
            duration: 250,
            easing: "swing",
            complete: function () {$(this).addClass('hidden');}
        });
    };
    
    /* the following (initialization) fragment runs only once */
    // tackle #wordEdit
    $("#wordEdit")
    .on('submit', 'form', EventNamespace.submitHandlers.wordEdit)
    .on('reset', 'form', EventNamespace.resetHandlers.wordEdit)
    .on('click', 'button', EventNamespace.clickHandlers.wordEdit)
    .find('#wordEdit-basicInfo > div').first().append(
        $('<label>').attr('for', 'wordEdit-basicInfo-sp').text('Spelling'),
        $('#templates .wordEdit-sp').clone().attr('id', 'wordEdit-basicInfo-sp').addClass('resettable')
    )
    .next().append(
        $('<label>').attr('for', 'wordEdit-basicInfo-lang').text('Language'),
        $('#templates .wordEdit-lang').clone().attr('id', 'wordEdit-basicInfo-lang')
    );
    
    // tackle #wordView
    $("#wordView").on('click', EventNamespace.clickHandlers.wordView);

    // assign a global discard handler managing the ESC keypress
    $(window).on('keyup', EventNamespace.keyHandlers.dismissViewers);
    
    return that;
}());

$(document).ready(function () {
    // retrieve all languages from server
    ajaxOperations.getLanguages().then(
        function (response) {
            if (!response.success)
                return;
            response.data.forEach(function (lang) {
                $('<option>').attr({value : lang}).html(lang).appendTo($('select[name=defLang]'));
            });
            console.log(response.message);
        },
        function () {
            $('<option>').attr({value : 'en'}).html('en').appendTo($('select[name=defLang]'));
            console.log('Couldn\'t load the languages due to server error. Adding english as default language!');
        }
    );

    // retrieve all the words from the server and populate wordList or display a fail dialog on failure
    ajaxOperations.getWords().then(
        DomManipulations.wordList.populate, 
        viewers.failDialog
    );

}); // end of ready handler