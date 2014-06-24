<?php
class Definition {
    private $lang = "en";
    private $body = "";

    function __construct ($b, $l="en") {
        $this->setBody($b);
        $this->setLang($l);
    }

    function getLang() {return $this->lang;}
    function getBody() {return $this->body;}
    function setLang($l) {
        if (!is_string($l) || empty($l)) {
            throw new Exception("Language must be a non-empty string");
        }
        $this->lang = $l;
    }
    function setBody($b) {
        if (empty($b) || !is_string($b)) {
            throw new Exception("Definition body must be a non-empty string");
        }
        $this->body = $b;
    }

    function __toString() {
        return 
            json_encode (
                array('lang'=>$this->lang, 'body'=>$this->body)
            )
        ;
    }
}