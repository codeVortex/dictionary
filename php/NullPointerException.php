<?php

/* 
 * @author Athanasios Kontis
 * 
 * A specialized Exception to be thrown when encountering an unexpected null value
 */
use Exception;

class NullPointerException extends Exception {        
    
    const ERROR_CODE = 100;

    function __construct($argumentName="<undefined>") {
        $message = sprintf("Unexpected NULL value for '%s' argument", $argumentName);
        parent::__construct($message, self::ERROR_CODE, null);
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
        $givenType = gettype($givenObject);
        $expectedType = gettype($expectedObject);
        $givenResolved = ($givenType === 'object') ? get_class($givenObject) : $givenType;
        $expectedResolved = ($expectedType === 'object') ? get_class($expectedObject) : $expectedType;
                
        $message = sprintf("Illegal argument object type: given '%s', but expected '%s'", 
            $givenResolved, $expectedResolved);
        parent::__construct($message, self::ERROR_CODE, null);
    }
    
}
