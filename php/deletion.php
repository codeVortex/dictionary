<?php
/** @author Athanasios Kontis */
class Deletion extends Operation {	
        
    private $words = [];          // an string array of deletable words

    function __construct(Dictionary $dic, $target) {
        parent::__construct($dic);
        
        if (is_string($target)) {
            $target = array($target);   // encapsulate value into an array
        }
        else if (!(is_array($target))) {
            throw new InvalidArgumentException('Target is expected to be string or array, ' . gettype($target) . ' given');
        }
        
        if (empty($target)) {
            throw new LengthException('Unexpected empty array of words');
        }
        foreach ($target as $deletable) {
            if (preg_match(Word::ACCEPTED_SPELLING_PATTERN, $deletable) === 1) {
                $this->words[] = $deletable;
            }
        }
    }

    function execute() {
        try {
            $deletionCounter = $this->dic->remove($this->words);
            if ($deletionCounter > 0) {
                $this->response = new Response(true, sprintf(
                    'Operation successful. %d %s removed!', $deletionCounter, $deletionCounter===1 ? 'word' : 'words'));
            } else {
                $this->response = new Response(false, sprintf('No words were removed based on given criteria', $deletionCounter));
            }
        }
        catch (Exception $ex) {
            $this->response = new Response(false, $ex->getMessage());
        }
    }
}