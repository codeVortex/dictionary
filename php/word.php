<?php
class Word {
    // constants
    const ACCEPTED_SPELLING_PATTERN = '/^\w+-?\w+$/u';
    // data members
    private $sp = "";		// spelling of the defined word (mandatory)
    private $lang = "";         // language the word belongs to
    private $defs = [];		// array of Definitions (optional)
    private $syns = [];		// array of synonym Words (optional)

    function __construct ($sp, $lang="en", $defs=array(), $syns=array()) {
        //if (!mb_regex_encoding('utf-8')) throw Exception('Encoding could not change to UTF8');
        $this->setSp($sp);
        $this->setDefs($defs);        
        $this->setSyns($syns);
        $this->setLang($lang);
    }

    function getLang() {return $this->lang;}
    function setLang($lang) {
        if (is_string($lang) && !empty($lang)) {
            $this->lang = $lang;
        }
    }
    
    function getSp() {return $this->sp;}
    function setSp($sp) {
        if (!is_string($sp)) {
            throw new Exception(sprintf("Expected a string for spelling arg; %s given", gettype($sp)));
        }
        $sanitary_pattern = array('/\s/', '/--/');
        $replacement = array('', '-');
        $sp = preg_replace($sanitary_pattern, $replacement, $sp);        
        if (preg_match( self::ACCEPTED_SPELLING_PATTERN, $sp ) === 1) {
            $sp = mb_convert_case($sp, MB_CASE_LOWER, "UTF-8");
            $this->sp = $sp;
        }
        else if (empty($sp)) {
            throw new Exception("Spelling string arg cannot be empty");
        }
        else {
            throw new Exception(sprintf("Spelling string does not satisfy the pattern: $sp", ACCEPTED_SPELLING_PATTERN));
        }
    }

    private function setSyns($syns) {
        if (empty($syns)) {
            $this->syns = array();
        }
        else if (is_array($syns)) {
            foreach($syns as $syn) {
                if ($syn instanceof Word) {
                    $this->addSyn($syn);
                }
                else if (is_string($syn)) {
                    $this->addSyn(new Word($syn));
                }
            }
        }
        else if ($syns instanceof Word) {
            $this->addSyn(syns);
        }
        else if (is_string($syns)) {
            $this->addSyn(new Word($syns));
        }
        else {
            throw new Exception('Expected a Word|string array or null ');
        }
    }

    function addSyn(Word $syn) {
        if (empty($syn)) {
            return false;
        }
        foreach ($this->syns as $index=>$storedSyn) {
            if ($storedSyn->equals($syn)) {
                return false;
            }
        }
        $this->syns[] = $syn;
        return true;
    }

    function removeSyn($syn) {
        foreach ($this->syns as $index=>$storedSyn) {
            if ($storedSyn->equals($syn)) {
                unset($this->syns[$index]);
                return true;
            }
        }
        return false;
    }

    /** 
     * @param Definition $def The Definition to be added to current array of definitions, $this->defs
     * @return boolean True if addition is successful and false in every other case */
    function addDef (Definition $def) {
        if (empty($def) || in_array($def, $this->defs, true)) {
            return false;
        }
        else {
            $this->defs[] = $def;
            return true;
        }
    }

    /** 
     * @param Definition $def The Definition to be removed from current array of definitions, $this->defs
     * @return boolean True if removal is successful and false in not
     */
    function removeDef (Definition $def) {
        if (empty($def)) {
            return false;
        }
        else if (in_array($def, $this->defs, true)) {
            unset($this->defs[$index]);
            return true;
        }
        else {
            return false;
        }
    }

    private function setDefs(array $defs) {
        if (is_null($defs)) {
            $this->defs = array();	// set defs member to an empty array
        }
        else if (is_array($defs)) {
            $this->defs = array();  // clears the array, in case it has already some values stored
            foreach($defs as $def) {
                $this->addDef($def);
            }             
        }
        else {
            throw new Exception('Expected a Definition array or null ');
        }
    }

    function getSynSps() {
        $arrOfSyns = [];
        foreach ($this->syns as $syn) {
            $arrOfSyns[] = $syn->getSp();
        }
        return $arrOfSyns;
    }
    
    function getDefsBodies() {
        $arrOfDefs = [];
        foreach ($this->defs as $def) {
            $arrOfDefs[$def->getLang()][] = $def->getBody();
        }
        return $arrOfDefs;
    }

    /** Static factory that creates Word objects from JSON data.     
     * @param string|array $jsonData A string holding the Word data in JSON format, or an array holding the decoded json data
     * @return Word A newly created Word instance
     */	
    static function createFromJson ($jsonData) {
        $wordDataArr = (is_string($jsonData)) ? json_decode( $jsonData, true ) : $jsonData;
        $sp = array_key_exists('sp', $wordDataArr) ? $wordDataArr['sp'] : null;
        $lang = array_key_exists('lang', $wordDataArr) ? $wordDataArr['lang'] : 'en';
        $defs = [];
        if (array_key_exists('defs', $wordDataArr) && is_array($wordDataArr['defs'])) {
            foreach ($wordDataArr['defs'] as $def) {
                if (array_key_exists('body', $def) && array_key_exists('lang', $def)) {
                    $defs[] = new Definition($def['body'], $def['lang']);
                }
            }
        }
        $syns = [];
        if (array_key_exists('syns', $wordDataArr) && is_array($wordDataArr['syns'])) {
            foreach ($wordDataArr['syns'] as $syn) {
                $syns[] = self::createFromJson($syn);
            }
        }        
        return new Word($sp, $lang, $defs, $syns);
    }

    /**
     * Delivers the current instance's data in JSON format.
     * @return string A JSON formatted string
     */
    function convertToJson() {
        $defs = [];
        foreach ($this->defs as $def) {
            $defs[] = ['lang'=>$def->getLang(), 'body'=>$def->getBody()];
        }
        $syns = [];
        foreach ($this->syns as $syn) {            
            $syns[] = ['sp'=>$syn->getSp(), 'lang'=>$syn->getLang()];
        }
        $instance = [
            'sp'=>$this->sp,
            'lang'=>$this->lang,
            'defs'=>$defs,
            'syns'=>$syns
        ];
        return json_encode($instance, Response::JSON_ENCODE_DEFAULT_OPTIONS);
    }

    function __toString() {return $this->sp;}

    function equals(Word $otherWord) {
        return is_null($otherWord) ? false : ($this->sp === $otherWord->getSp());
    }
  
}