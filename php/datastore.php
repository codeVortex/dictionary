<?php
class DataStore
{	
    protected $resource = null; // the resource handle for the used dataset
    protected $content = null;	// a multidimensional array which holds the decoded content of the linked JSON resource file

    function __construct( SplFileObject $splFileObject, $inStream=null){
        if (is_null($splFileObject)) {
            throw new Exception('Null resource handle for DataStore');
        } else if ($splFileObject instanceof SplFileObject) {
            $this->resource = $splFileObject;
        }
        // check the stream argument
        if (empty($inStream)) {
            $this->inputStream = $inStream;
        }
    }

    function __destruct() {
        $this->resource = null;
        $this->content = null;
    }

    /** Lazy content loader (loads content when needed for the 1st time) */
    private function loadContent() {
        $json_content = "";
        $this->resource->rewind();
        $this->resource->flock(LOCK_SH);
        while(!$this->resource->eof()) {
            $json_content .= $this->resource->fgets() . PHP_EOL;
        }
        $this->resource->flock(LOCK_UN);
        //$this->content = json_decode($json_content, true);
        $this->content = $json_content;
    }

    /** 
     *  Returns a copy of the loaded content. If it is not loaded yet, due to lazy loading approach,
     *  it gets loaded calling the $this->loadContent().
     *	@return string The current content in json format. There is not guarantee that it is the original during loading
     *	from data source since it can be modified at any time with a call to $this->setContent()
     */
    function getContent() {
        if (empty($this->content)) {
            $this->loadContent();   // lazy loading of content if it is the first access
        }
        return $this->content;
    }

    /** 
     * Modifies the runtime loaded content with new content 
     *	@param string $updatedContent The modified version of content given in JSON format     
     */
    function setContent($updatedContent) {
        $this->content = $updatedContent;
    }

    /** @return SplFileObject Returns the SplFileObject instance that backs the datastore */
    function getResource() {return $this->resource;}

    /** Retrieves content from the php input stream */
    static function getRawPostData() {return file_get_contents('php://input');}	

    /** Save the runtime modified content to the physical file indicated 
     *  by the resource, after converting it back to json format 
     */
    function saveContent() {		
        //$json_content = json_encode($this->content, JSON_PRETTY_PRINT|JSON_UNESCAPED_UNICODE);
        $this->resource->flock(LOCK_EX);
        $this->resource->rewind(); // move file pointer back to 1st line
        $this->resource->fwrite($this->content);
        $this->resource->fflush();
        $this->resource->ftruncate($this->resource->ftell());
        $this->resource->flock(LOCK_UN);
    }        
}
