<?php
/** @author Athanasios Kontis */
class Update extends Operation
{	
    private $updatedWord = null; // the candidate Word that is going to be updated

    function __construct(Dictionary $dictionary, Word $updatedWord) {
        parent::__construct($dictionary);
        if (is_null($updatedWord)) {
            throw new Exception("The updatedWord is expected to be a non-null Word object");
        }
        $this->updatedWord = $updatedWord;  // save the validated argument to local variable	
    }

    function execute()
    {        
        try {
            $this->dic->update($this->updatedWord);
            $this->response = new Response(true, "Word updated successfully!");
        }
        catch (Exception $ex) {
            $this->response = new Response(false, $ex->getMessage());
        }
    }
}