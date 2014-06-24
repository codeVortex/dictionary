<?php

/* 
 * @author Athanasios Kontis 
 * A specialized Exception to be thrown when encountering an unexpected null value
 */
use Exception;

class NullPointerException extends Exception {        
    
    const ERROR_CODE = 100;

    /**
     * Informs the caller of the argument was found null
     * @param string $argumentName The identifier of the argument that was null
     * @param Exception $prev A previous (chained) Exception
     */
    function __construct($argumentName="<undefined>", $prev=null) {
        $message = sprintf("Unexpected NULL value for '%s' argument", $argumentName);
        parent::__construct($message, self::ERROR_CODE, $prev);
        $this->message .= sprintf("in `%s`, line %d", $this->file, $this->line);
    }
}

class IllegalArgumentException extends Exception {

    const ERROR_CODE = 101;

    /**
     * Inspects the runtime types of given and expected arguments to use their type names in the Exception message
     * @param Object $givenObject
     * @param Object $expectedObject
     */
    function __construct($givenObject, $expectedObject) {
        parent::__construct("Illegal argument object type: ", self::ERROR_CODE, null);
        $givenType = gettype($givenObject);
        $expectedType = gettype($expectedObject);
        $givenResolved = ($givenType === 'object') ? get_class($givenObject) : $givenType;
        $expectedResolved = ($expectedType === 'object') ? get_class($expectedObject) : $expectedType;                
        $this->message .= sprintf(
            "given '%s', but expected '%s' in `%s`, line %d", 
            $givenResolved, $expectedResolved, $this->file, $this->line
        );
        if ($givenType === 'NULL') {throw new NullPointerException('givenObject', $this);}
    }    
}
