<?php
/** @author Athanasios Kontis */
class Insertion extends Operation
{	
    private $newWord = null;	// the new entry to be inserted into the DataStore

    function __construct(Dictionary $dictionary, Word $newWord) {
        parent::__construct($dictionary);
        if (is_null($newWord)) {
            throw new Exception("The new Word entry cannot be null");
        }
        $this->newWord = $newWord;
    }

    function execute()
    {        
        try {
            $this->dic->add($this->newWord);
            $this->response = new Response(true, "Word inserted successfully!");
        }
        catch (Exception $ex) {
            $this->response = new Response(false, $ex->getMessage());
        }        
    }
}