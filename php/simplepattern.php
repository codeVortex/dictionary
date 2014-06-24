<?php
/** 
 * @author Athanasios Kontis
 * This class encapsulates a PCRE pattern to facilitate retrieval operations
 * 
 */
class SimplePattern {
    private $token = '';
    private $filter = '';
    private $pcre = '';
    private $flags = '';
    private $ACCEPTED_FILTERS = ['contains','equals','starts','ends'];
    const DEFAULT_FILTER = 'contains';
    private $ACCEPTED_FLAGS = ['i','m','e','s','x'];
    const DEFAULT_FLAG = 'i';

    /**
     * Creates a SimplePattern object which facilitates lookups against a collection of strings.
     * Keeping true to its name, it uses but a few named filters (read $filter param below) which 
     * correspond to real PCRE patterns when used in a lookup.     
     * @param string $token The string token to lookup in the dictionary
     * @param string $filter The simple filter to use for the matching: 'contains' (DEFAULT), 'equals', 'starts', 'ends'
     * @param string $flags The PCRE flags to use for the matching: i (DEFAULT), m, e, s, x
     */
    function __construct ($token, $filter=self::DEFAULT_FILTER, $flags=self::DEFAULT_FLAG)
    {
            $this->token = (empty($token)) ? '.*' : $token;
            $this->filter = (in_array($filter, $this->ACCEPTED_FILTERS, true)) ? $filter : self::DEFAULT_FILTER;
            $this->flags = (in_array($flags, $this->ACCEPTED_FLAGS, true)) ? $flags : self::DEFAULT_FLAG;
            $this->compile();
    }

    function compile() {
            switch($this->filter) {
            case 'contains':
                    $this->pcre = '/'. $this->token . '/' . $this->flags;
                    break;
            case 'starts':
                    $this->pcre = '/^'. $this->token . '/' . $this->flags;
                    break;
            case 'ends':
                    $this->pcre = '/'. $this->token . '$/' . $this->flags;
                    break;
            case 'equals': // is also the default filter if no other applicable is defined
            default:
                    $this->pcre = '/^'. $this->token . '$/' . $this->flags;
            }		
    }

    function getPCRE() {return $this->pcre;}

    /** Grabs the elements of an associative array whose keys match the pattern 
     * @param array $arr The associative array to filter
     * @param int $flags The 3rd argument of the preg_grep function; default value is 0.
     * @return array The filtered array
     */
    function keyGrep(array $arr, $flags=0) {		
        $keys = array_keys($arr); // gets an assoc array of $arr keys
        $grepped = preg_grep($this->pcre, $keys, $flags);		
        foreach ($arr as $key=>$val) {
            if (!in_array($key, $grepped)) {
                unset($arr[$key]);
            }
        }		
        return $arr;
    }	
}
