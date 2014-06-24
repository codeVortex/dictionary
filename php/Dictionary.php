<?php

/* 
 * @author Athanasios Kontis
 * 
 * Dictionary is a Word object storage that can synchronize to and from an associated DataStore,
 * depending on the operation. It implements basic storage related functionalities. 
 */

class Dictionary {
    
    private $wordsArr = []; // a lookup array containing spellings of the words as key and pointing to the associated Word objects
    private $dataStore = null;
    
    function __construct (DataStore $dataStore) {
        if (is_null($dataStore)) {throw new NullPointerException('dataStore');}
        $this->dataStore = $dataStore;
        $this->syncWordsArr();                
    }
    
    /**
     * synchronizes wordsArr to the current data of dataStore
     */
    private function syncWordsArr(){        
        $decodedContent = json_decode($this->dataStore->getContent(), true);
        foreach ($decodedContent as $wordData) {
            $newWord = Word::createFromJson($wordData);
            $sp = $newWord->getSp();
            $this->wordsArr[$sp] = $newWord;
        }
    }
    
    /**
     * synchronizes dataStore to the current data of wordsArr
     */
    private function syncDataStore() {
        $updatedContent = '[' . PHP_EOL;  // a json string carrying the updated content
        $totalWords = count($this->wordsArr); $iteration = 1;
        foreach ($this->wordsArr as $wordObj) {
            if ($iteration < $totalWords) {
                $updatedContent .= $wordObj->convertToJson() . ',' . PHP_EOL;
            } 
            else if ($iteration === $totalWords) {
                $updatedContent .= $wordObj->convertToJson() . PHP_EOL . ']';
            }
            $iteration++;
        }        
        $this->dataStore->setContent($updatedContent);
        $this->dataStore->saveContent();
    }
    
    /**
     * Checks whether a specific word exists in the Dictionary or not, based on spelling check
     * @param Word|string $word The word to lookup in the Dictionary
     * @return boolean Returns the result of the Word containment check
     */
    function contains($word) {
        if (empty($word)) {
            throw new NullPointerException("word");            
        }        
        elseif ($word instanceof Word) {
            return array_key_exists($word->getSp(), $this->wordsArr);            
        }
        elseif (is_string($word)) {
            return array_key_exists($word, $this->wordsArr);            
        }
        else {
            return false;
        }        
    }
    
    /**
     * Adds a new Word entry if current Dictionary does not contain already one with spelling of the $newWord instance. It will NOT update an existing entry with $newWord!
     * @param Word $newWord The new Word instance to be added
     * @param boolean $sync Flag signaling dataStore's synchronization
     * @throws NullPointerException
     * @return boolean The result of the operation
     */
    function add(Word $newWord, $sync=true) {
        if ($this->contains($newWord->getSp())) {
            throw new OutOfBoundsException('Attempted to add an already existing word: '. $newWord);
        }
        $this->wordsArr[$newWord->getSp()] = $newWord;  // update the stored Word at position wordIndex with the $newWord instance
        if ($sync) {$this->syncDataStore();} // synchronize dataStore's file content (json file) with lookup array $this->wordsArr
    }
    
    /**
     * Removes an existing Word entry from the Dictionary
     * @param Word $deletableWord The word to be deleted     
     * @param boolean $sync Flag signaling dataStore's synchronization
     * @throws OutOfBoundsException When deletableWord is null or not found in the Dictionary
     * @return Word Returns the removed word
     */
    function removeSingle($deletableWord, $sync=true) {
        if (empty($this->wordsArr)) {
            throw new UnderflowException('Attempted removal from an empty dictionary');
        }
        elseif (!$this->contains($deletableWord)) {
            throw new OutOfBoundsException("Attempted to remove a non-existing word from the dictionary");
        }
        elseif (!($deletableWord instanceof Word) && !is_string($deletableWord)) {
            throw new InvalidArgumentException('Argument type must be Word or string');
        }
        $key = is_string($deletableWord) ? $deletableWord : $deletableWord->getSp();        
        $removedWord = $this->wordsArr[$key];
        unset($this->wordsArr[$key]);
        if ($sync) {$this->syncDataStore();}    // synchronize dataStore's file content (json file) with runtime content
        return $removedWord;
    }
    
    /**
     * 
     * @param array $words A string array of words to be removed
     * @param type $sync Flag for dataStore synchronization
     * @throws LengthException If the words array is empty
     * @throws Exception
     * @return int The number of removed words
     */
    function remove(array $words, $sync=true) {
        if (empty($words)) {
            throw new LengthException('Words argument cannot be an empty array');
        }
        $removed = [];
        foreach ($words as $word) {
            try {
                $removed[] = $this->removeSingle($word, false);
            }
            catch (Exception $ex) {
                // revert the changes to $this->wordsArr
                foreach ($removed as $word) {$this->add($word, false);}
                throw $ex;
            }
        }
        if ($sync) {$this->syncDataStore();}
        return count($removed);
    }
    
    /**
     * Combines a word removal and word insertion and micromanages dataStore 
     * synchronization for better performance
     * @param Word $updatedWord The updated Word instance
     * @throws NullPointerException, IllegalArgumentException, OutOfBoundsException
     */
    function update(Word $updatedWord) {        
        $this->removeSingle($updatedWord, false);
        $this->add($updatedWord, true);
    }
    
    /**
     * Filters the datastore content to grab the matched entity's values based on a given pattern.
     * @param SimplePattern $pattern The SimplePattern instance to use for the filtering
     * @param Object|string $retrievable The retrievable entity to search for through the dataStore
     * @throws NullPointerException, InvalidArgumentException, OutOfBoundsException
     * @return array A filtered array in json format (from $this->wordsArr)
     */
    function get(SimplePattern $pattern, $retrievable) {        
        if (empty($pattern) || empty($retrievable)) {
            throw new NullPointerException('pattern, retrievable');
        }
        $entity = (is_string($retrievable)) ? $retrievable :
            (gettype($retrievable)==='object' ? get_class($retrievable) : "");
        $filtered = []; // the filtered array to be returned
        switch (strtolower($entity))
        {
            case 'word':
                $filtered = $pattern->keyGrep($this->wordsArr);
                break;
            case 'language':
                // TODO: Implement language search
                break;
            default:
                throw new UnexpectedValueException(sprintf('$retrievable arg expected to be `Word` or `Language`, `%s` given', $retrievable));
        }        
        return $filtered;
    }
}
