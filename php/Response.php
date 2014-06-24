<?php

/* 
 * To change this license header, choose License Headers in Project Properties.
 * To change this template file, choose Tools | Templates
 * and open the template in the editor.
 */
class Response {
    
    const JSON_ENCODE_DEFAULT_OPTIONS =  384;  //JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE;
    private $json_encode_flags = self::JSON_ENCODE_DEFAULT_OPTIONS;	// coerce the use of setJsonFlags() to set the flags
    private $success;
    private $message;
    private $data;
    
    function __construct( $success=false, $message="Operation failed", $data=null) {
        if (!is_bool($success)) {
            throw IllegalArgumentException("Success argument must be a boolean");
        }
        if (!is_string($message)) {
            throw IllegalArgumentException("Message argument must be a string");
        }
        $this->success = $success;
        $this->message = $message;
        $this->data = $data;
    }
    
    function setJsonFlags ( $options ) {
        if (empty($options) || !is_numeric($options)) {
            $options = self::JSON_ENCODE_DEFAULT_OPTIONS;
        }
        $this->json_encode_flags = $options;
    }
    function convertToJson() {
        return sprintf('{"success": %s, "message": "%s", "data": %s}',
            $this->success ? 'true' : 'false', 
            $this->message, 
            is_null($this->data) ? 'null' : $this->data
        );
    }
    
}
