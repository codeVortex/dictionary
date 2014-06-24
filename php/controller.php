<?php
header('Content-Type: text/html; charset=utf-8');
// auto class loader facility
$load_result = spl_autoload_register (
    function($className){
        if (empty($className)){
            throw new Exception("Class name cannot be empty");
        }
        // special case for loading custom exceptions located in "Exceptions.php"
        elseif (strpos($className, "Exception") !== false) {
            include ("Exceptions.php");
        }
        // normal loading of all other classes
        else {
            include strtolower($className) . '.php';
        }
    }
, true, true);

// The operation type that was requested from the client (default is : retrieval)
$operationType = isGet('op') ? get('op') : "get";

// the Operation object which will handle the request according to its subtype
$operation = null;

// DataStore: An object encapsulating the datasource that backs Dictionary
$resource = new SplFileObject("..\words.json", "r+");
$dataStore = new DataStore($resource);

// Instantiate the Dictionary
$dic = new Dictionary($dataStore);

// Simple pattern object is used in all filter-based lookups.
// To create it we need a valid filter and a search token.
$searchToken = isGet('token') ? get('token') : '';	// sets the search token
$searchFilter = isGet('filter') ? get('filter') : '';   // sets the filter
$simplePattern = new SimplePattern($searchToken, $searchFilter);

// Instantiate the proper Operation type
switch ($operationType) {
    case "get":
        // sets the target entity (default is 'words')
        $target = (isGet('target')) ? get('target') : 'word';
        $operation = new Retrieval($dic, $target, $simplePattern);
        break;
    case "insert":
        $newWord = Word::createFromJson(DataStore::getRawPostData());
        $operation = new Insertion($dic, $newWord);
        break;
    case "update":
        $wordToUpdate = Word::createFromJson(DataStore::getRawPostData());
        $operation = new Update($dic, $wordToUpdate);
        break;
    case "delete":
        $target = (isGet('target')) ? get('target') : null;
        $operation = new Deletion($dic, $target);
        break;
    default:
        throw new UnexpectedValueException("Unknown operation");
}

$operation->execute();          // execute the prepared operation
$operation->getJsonResponse();	// echo the json encoded response back to the client


function isGet( $value ) {return filter_has_var( INPUT_GET, $value );}
function get ($name) {return filter_input( INPUT_GET , $name );}
?>