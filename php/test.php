<?php
header('Content-Type: text/html; charset=utf-8');

// auto class loader facility
$load_result = spl_autoload_register (
    function($className){
        if (empty($className)){ throw new Exception("Class name cannot be empty");}		
        include strtolower($className) . '.php';
    }
, true, true);

$words = json_decode( file_get_contents('../words_backup.json'), true );

var_dump($words);


/*
// DataStore: An object encapsulating the datasource that backs Dictionary
$resource = new SplFileObject("..\words.json", "r+");
$dataStore = new DataStore($resource);

// Instantiate the Dictionary
$dic = new Dictionary($dataStore);

$retrieved = $dic->get(new SimplePattern('mo','contains'), 'word');
 *
 */

?>