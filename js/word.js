var DictionaryApp = DictionaryApp  || {};

DictionaryApp.Utilities = (function() {
    "use strict";
    return {
        // checks a variable s if it is of type string and does not match the empty regex (/^\s*$/ one or more spaces)
        isEmptyOrWhitespace: function (s) {
            return ((typeof s === "string") && /^\s*$/.test(s));
        },

        // a cloning function for different types of built-in objects
        clone: function (obj) {
            // Handle the 3 simple types, and null or undefined
            if (null === obj || "object" !== typeof obj) {
                return obj;
            }

            // Handle Date
            if (obj instanceof Date) {
                var copy = new Date();
                copy.setTime(obj.getTime());
                return copy;
            }

            // Handle Array
            if (obj instanceof Array) {
                var copy = [];
                for (var i = 0, len = obj.length; i < len; i++) {
                    copy[i] = clone(obj[i]);
                }
                return copy;
            }

            // Handle Object
            if (obj instanceof Object) {
                var copy = {};
                for (var attr in obj) {
                    if (obj.hasOwnProperty(attr)) copy[attr] = clone(obj[attr]);
                }
                return copy;
            }

            throw new Error("Unable to copy obj! Its type isn't supported.");
        }
    };
}());

// closure defining the dictionary namespace
DictionaryApp.Model = (function(words) {
    "use strict";
    var model = DictionaryApp.Model || {};
    
    // callbacks
    var addSingleSyn = function(syn) {if (syn) this.syns.push(syn);},
        addSingleDef = function(def) {if (def) this.defs.push(def);};
    
    // shortcuts
    var isEmptyOrWhitespace = DictionaryApp.Utilities.isEmptyOrWhitespace;
    
    /** 
     * Word encapsulates the main entity of the application
     * @param spelling {string} The only required arg representing the spelling of the word
     * @param lang {string} Optional string arg representing the language this word is part from (in its ISO 2-letter representation). Default is "en" for "english"
     * @param syns {array} Optional array of strings arg representing the collection of synonyms to this word. Default is an empty array.
     * @param defs {array} Optional array of strings arg representing the collection of definitions to this word. Default is an empty array.
     */
    function Word (spelling, lang, syns, defs) {        
        spelling = spelling || '';        
        if (isEmptyOrWhitespace(spelling)) throw new Error("Spelling argument must be a non-empty string");    
        // properties
        this.sp = spelling.trim();
        this.lang = !isEmptyOrWhitespace(lang) ? lang : "en";
        this.syns = [];  // map for synonyms
        this.defs = [];  // array for definitions

        /// method invocation
        this.addSyns(syns);
        this.addDefs(defs);
        Object.seal(this);
    } // end of Word constructor function
    
    Word.prototype = {
        toString: function() {return this.sp + " (" + this.lang + ")";
        },
        removeSyn: function(syn) {
            if ((syn instanceof Word) && this.syns.hasOwnProperty(syn.sp)) {
                delete this.syns[syn.sp];
                return true;
            }
            else if (!isEmptyOrWhitespace(syn) && this.syns.hasOwnProperty(syn)) {
                delete this.syns[syn];
                return true;
            }
            return false;
        },
        removeDef: function(index) {
            if ((this.defs.length > 0) && (0 <= index && index < this.defs.length)) {
                this.syns.splice(index, 1);
                return true;
            }
            return false;
        },
        addSyns: function(syn) {
            if (Array.isArray(syn)) {
                syn.forEach( addSingleSyn, this );
            }
            else if (typeof syn === 'object') {
                addSingleSyn.apply( syn, this );
            } 
        },
        addDefs: function(def) {
            if (Array.isArray(def)) {
                def.forEach( addSingleDef, this );
            }
            else if (typeof def === 'object') {
                addSingleDef.apply( def, this );
            }
        }
    }; // end of Word Prototype

    /** 
     * The Dictionary module encapsulates the collection of Word objects, whereby we manage them
     */
    model.Dictionary = (function(){
        var wordStore = {}; // backing map data structure; PRIVATE member    
        
        // Dictionary API
        var dicInstance = {
            
            // @param words {array|string|Word} Optional array of Word objects or strings, or even a single string or Word object, 
            // which will be converted to Word objects and added to the wordStore.
            addWords: function( words ) {
                if (Array.isArray(words)) {
                    words.forEach(function(word){ // check use instead of suggested signature function(word, index, arr)
                        if ((word instanceof Word) && (!this.containsWord(word))) {this.addWord(word);}
                    });
                }
                else if (words instanceof Word) {
                    this.addWord(words);
                }
            },
            
            /** Factory method that creates Word objects from a plain object literal
            *   @param {object} wordData The javascript object literal containing the initialization data
            */
            parse: function ( wordData ) {
                if (typeof wordData !== 'object') {
                    throw new Error('createWord(): arg must be an object');
                }
                var sp = wordData.sp;
                var lang = wordData.hasOwnProperty('lang') ? wordData.lang : null;
                var syns = wordData.hasOwnProperty('syns') ? wordData.syns : null;
                var defs = wordData.hasOwnProperty('defs') ? wordData.defs : null;
                var word = new Word(sp, lang, syns, defs);
                return word;  
            },
            
            /** Adds a new word to the dictionary 
             * @param {Word} word The word object (or object literal representation of a Word obj) to be added */
            addWord : function( word ) {
                if (!(word instanceof Word)) {
                    try {
                        word = Word.parse(word);    // convert data to word object
                    }
                    catch (error) {
                        console.error('Word was not added to dictionary due to data parse error', error);
                        return false;
                    }
                }
                if (word && !this.containsWord(word)) {
                    wordStore[word.sp] = word;
                    return true;
                }
                else {
                    return false;
                }
            },
            
            // accepts both a string or Word object as argument
            removeWord : function (word){
                if (this.containsWord(word)) {
                    var sp = (word instanceof Word) ? word.sp : word;
                    wordStore[sp] = null;
                    delete wordStore[sp];
                }
                return false;
            },
            
            // accepts both a string or Word object as argument
            containsWord : function(word) {
                var sp = (word instanceof Word) ? word.sp : word;
                return wordStore.hasOwnProperty(sp); // search the map datastore at O(1) time!        
            },
            
            countWords : function() {return Object.keys(wordStore).length;},
            
            isEmpty : function() {return this.countWords() === 0;},
            
            empty : function() {wordStore = {};},
            
            getWords : function() {return clone(wordStore);},
            
            // accepts both a string or Word object as argument
            getWord: function(word) {
                var sp = (word instanceof Word) ? word.sp : word;
                return (this.containsWord(word)) ? wordStore[sp] : null;
            }
        };
        
        // Ensure that dictionary's props and methods cannot be deleted. Also it is not extensible
        Object.seal(dicInstance);
        return dicInstance;
    }()); // end of Dictionary module
    
    return model;
}());