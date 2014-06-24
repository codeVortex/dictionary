// closure defining the dictionary namespace
var dic = (function(words) {
    "use strict";

    // checks a variable s if it is of type string and does not match the empty regex (/^\s*$/ one or more spaces)
    function isEmptyStr(s) {
        return ((typeof s === "string") && /^\s*$/.test(s));
    };
    function isNonEmptyStr(s) {return (typeof s === 'string' && !/^\s*$/.test(s));};

    /** 
     * Word encapsulates the main entity of the application
     * @param spelling {string} The only required arg representing the spelling of the word
     * @param lang {string} Optional string arg representing the language this word is part from (in its ISO 2-letter representation). Default is "en" for "english"
     * @param syns {array} Optional array of strings arg representing the collection of synonyms to this word. Default is an empty array.
     * @param defs {array} Optional array of strings arg representing the collection of definitions to this word. Default is an empty array.
     */
    function Word (spelling, lang, syns, defs) {        
        spelling = spelling || '';        
        if (isEmptyStr(spelling)) throw new Error("Spelling argument must be a non-empty string");    
        // properties
        this.sp = spelling.trim();
        this.lang = isNonEmptyStr(lang) ? lang : "en";
        this.syns = [];  // map for synonyms
        this.defs = [];  // array for definitions
        // methods
        var that = this;    // a reference to current instance for use in loopbacks
        
        var addSingleSyn = function(syn) {if (syn) that.syns.push(syn);};            
        this.addSyns = function(syn) {
            if (Array.isArray(syn)) {
                syn.forEach(addSingleSyn);
            }
            else if (typeof syn === 'object') {
                addSingleSyn(syn);
            } 
        };
        
        var addSingleDef = function(def) {if (def) that.defs.push(def);};
        this.addDefs = function(def) {
            if (Array.isArray(def)) {
                def.forEach(addSingleDef);
            }
            else if (typeof def === 'object') {
                addSingleDef(def);
            }
        };
        /// method invocation
        this.addSyns(syns);
        this.addDefs(defs);
    }
        
    Word.prototype.toString = function() {return this.sp + " (" + this.lang + ")";}; 
    Word.prototype.removeSyn = function(syn) {
        if ((syn instanceof Word) && this.syns.hasOwnProperty(syn.sp)) {
            delete this.syns[syn.sp];
            return true;
        }
        else if (!isEmptyStr(syn) && this.syns.hasOwnProperty(syn)) {
            delete this.syns[syn];
            return true;
        }
        return false;
    };
    Word.prototype.removeDef = function(index) {
        if ((this.defs.length > 0) && (0 <= index && index < this.defs.length)) {
            this.syns.splice(index, 1);
            return true;
        }
        return false;
    };
    /** Public factory method to create Word objects from crude json data
     * @param {object} extraInfo The word data arguments delivered in JSON format
     */
    window.createWord = function(data) {
        var sp = data.sp;
        var lang = data.hasOwnProperty('lang') ? data.lang : null;
        var syns = data.hasOwnProperty('syns') ? data.syns : null;
        var defs = data.hasOwnProperty('defs') ? data.defs : null;
        var word = new Word(sp, lang, syns, defs);
        Object.seal(word);
        return word;
    };
    // end of Word definition and API

    /** 
     * Dictionary encapsulates the collection of Word objects through which we manage them
     * @param words {array|string} Optional array of Word objects. If not provided an empty Dictionary is instantiated instead 
     */
    function Dictionary(words) {
        // Private scope
        var data = {}; // backing map-like data structure; PRIVATE member    

        // Public API
        /** Adds a new word to the dictionary @param {Word} word The word object to be added */
        this.addWord = function(word) {
            if (!(word instanceof Word)) throw new Error("This function accepts only Word objects");
            if (!this.containsWord(word)) {data[word.sp] = word;}
        };
        this.removeWord = function (word){  // accepts both strings or a Word objects as an argument
            var token = null;
            if (word instanceof Word) { token = word.sp; }
            else if (typeof word === 'string') { token = word; }
            else throw new Error("This function accepts only Word or string objects");
            if (this.containsWord(word)) {
                data[token] = null;
                delete data[token];
            }
        };
        this.containsWord = function(word) {    // accepts both strings or a Word objects as an argument
            var token = null;
            if (word instanceof Word) { token = word.sp; }
            else if (typeof word === 'string') { token = word; }
            else throw new Error("This function accepts only Word or string objects");                
            return data.hasOwnProperty(token); // search the map datastore at O(1) time!        
        };
        this.countWords = function() {return Object.keys(data).length;};
        this.isEmpty = function() {return this.countWords() === 0;};
        this.empty = function() {data = {};};
        this.getWords = function() {return clone(data);};
        this.getWord = function(w) {
            var sp = (w instanceof Word) ? w.sp : ((typeof w === 'string') ? w : '');
            return data.hasOwnProperty(sp) ? data[sp] : null;
        };

        // Argument management
        if (words instanceof Array) {
            // ECMA5 new way of looping through an array
            // ensure that all the elements in words array are Word objects
            words.forEach(function(word){ // check use instead of suggested signature function(word, index, arr)
                if ((word instanceof Word) && (!this.containsWord(word))) {this.addWord(word);}
            });
        }
        else if (words instanceof Word) {
            this.addWord(words);
        }
    } 
    
    var instance = new Dictionary(words); // instantiate a new, empty  Dictionary
    Object.seal(instance); // Ensure that dictionary's props and methods cannot be deleted. Also it is not extensible
    return instance;
}());


function clone(obj) {
    // Handle the 3 simple types, and null or undefined
    if (null === obj || "object" !== typeof obj) return obj;
    
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