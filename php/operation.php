<?php
/** @author Athanasios Kontis */
abstract class Operation
{    
    protected $response = null;    
    protected $dic = null;

    function __construct (Dictionary $dictionary) {
        if (is_null($dictionary)) {
            throw new NullPointerException('dictionary');
        }
        $this->dic = $dictionary;
    }

    /** 
     *	Defines the operation-specific action which generates and stores 
     *	the results in the respective private fields ( result, details )
     */
    abstract function execute();

    /** Delivers back to client a json formatted response */
    function getJsonResponse(){		
        echo $this->response->convertToJson();
    }
}