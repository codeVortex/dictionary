<?php
/** @author Athanasios Kontis */
class Retrieval extends Operation
{
    private $target = null;	// the target entity to retrieve from the dataStore
    /* The SimplePattern object that will be used for filtering the words. 
       A null pattern implies retrieval of ALL entries from target entity. */
    private $simplePattern = null;

    function __construct(Dictionary $dic, $target=null, SimplePattern $simplePattern=null) {
        parent::__construct($dic);
        if (empty($target)) {
           throw new Exception('Target entity cannot be null');
        }
        $this->target = $target;
        $this->simplePattern = $simplePattern;
    }

    function execute()
    {
        try {
            $retrieved = $this->dic->get($this->simplePattern, $this->target);
            // check the grepped results to formulate the proper response
            if (count($retrieved) > 0) {
                $jsonData = '['; // string carrying the data in json format
                foreach ($retrieved as $word) {
                    $jsonData .= $word->convertToJson() . ',';
                }
                $jsonData = substr_replace($jsonData, ']', -1, 1);
                $this->response = new Response(true, count($retrieved) . ' word(s) retrieved successfully!', $jsonData);
            }
            else {
                $this->response = new Response(false, 'No words were retrieved with the given criteria');
            }
        }
        catch (Exception $ex) {
            $this->response = new Response(false, $ex->getMessage());
        }
    }
}