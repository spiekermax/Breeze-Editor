/* --DEPENDENCIES-- */
// -> Jquery import: renderer.html, line 11
const remote = require('electron').remote;
const ipc = require('electron').ipcRenderer;
const path = require('path');
const fs = require('fs');
// Global variables
var editor; // Code-editor reference
var viewedFile = "";
const PROJECT_MAX_FILES = 9000;


/* --INITIALIZER-- */
function onDocumentReady()
{
  // Check dependencies
  if(!window.jQuery)
  {
    alert("ERROR: jQuery is not working!");
  }

  // Create code-editor
  var code = document.getElementsByClassName("editor")[0];
  editor = CodeMirror.fromTextArea(code,
  {
    // Appearance
    theme: "orleans",
    lineNumbers: true,
    scrollbarStyle: "overlay",
    // Input processing
    tabSize: 2,
    extraKeys: {"Ctrl-Space": "autocomplete"},
    // Functionality
    mode:  "text/x-c++src",
    autoCloseTags: true,
    autoCloseBrackets: true
  }); // Code-editor events
  editor.on("drop", function(editor, evt)
  { 
    evt.preventDefault();
    // Read file when path is dropped
    var path = evt.dataTransfer.getData("text");
    if( path == "" ){
      path = evt.dataTransfer.files[0].path;
    } else {
      path = path.replace("file:///", "");
    }
    if( !fs.statSync(path).isDirectory() ) {
      fs.readFile(path, 'utf8', function(err, contents) {
        editor.setValue(contents);
        if(err) {
          return console.log(err);
        }
      });
      viewedFile = path;
    }
  });
  
  // Create fileviewer
  var dir = "./"; // Directory source
  $("#fileview-project-tree").jstree(
  {
    "core": {
      check_callback: true,
      dblclick_toggle : false,
      themes: {
        name: "default",
        dots: false
      }
    },
    "plugins": [
      "themes"
    ]
  });
  // Set tree title
  $("#fileview-project-title").prepend( document.createTextNode( path.dirname( __dirname ).split( path.sep ).pop() ) );
  // List project files
  listProjectFiles(dir, "#");
}


/* --EVENT HANDLING-- */
// Fileview: Fold / unfold on single click
$("#fileview-project-tree").on("click", ".jstree-anchor", function(evt)
{
  $("#fileview-project-tree").jstree(true).toggle_node(evt.target);
});
// Fileview: Open file on double click
$("#fileview-project-tree").bind("dblclick.jstree", function(evt)
{
  var path = evt.target.getAttribute("href");
  path = path.replace("../", "");
  if( !fs.statSync(path).isDirectory() ) {
    fs.readFile(path, 'utf8', function(err, contents) {
      editor.setValue(contents);
      if(err) {
          return console.log(err);
      }
    });
    viewedFile = path;
  }
});
// Key: Any down
$(document).on("keydown", function(evt)
{
  console.log($($("#fileview-project-tree").jstree(true).get_node("j1_47")).attr("data").srcpath);
  var keyCode = evt.keyCode;
  // Ctrl + S
  if( keyCode == 83 && evt.ctrlKey ) 
  {
    try 
    { 
      ipc.send( "editorValue", editor.getValue('\r\n') );
      fs.writeFile(viewedFile, editor.getValue('\r\n'), function(err) {
        if(err) {
          return console.log(err);
        }
      });
    }
    catch(e) 
    { 
      alert("ERROR: Can not save file!")
    }
  }
  // Ctrl + A
  if( keyCode == 65 && evt.ctrlKey ) 
  {
    try 
    { 
      evt.preventDefault();
      editor.execCommand("selectAll");
    }
    catch(e) 
    { 
    }
  }
});
// Key: Any up
$(document).on("keyup", function(evt) 
{
  $("#statusbar-line").html( "Line " + (editor.getCursor().line + 1) + "," );
  $("#statusbar-column").html( "&nbspColumn " + (editor.getCursor().ch + 1) );
});

// Mouse: Any click
$(document).on("click", function(evt)
{
  $("#statusbar-line").html( "Line " + (editor.getCursor().line + 1) + "," );
  $("#statusbar-column").html( "&nbspColumn " + (editor.getCursor().ch + 1) );
});

// Statusbar: Tabsize edit
function onTabsizeEdit() 
{
  var form = $("#statusbar-tabsize");
  if ( form.value.length > form.maxLength ) 
  {
    form.value = form.value.slice( 0, form.maxLength );
  }
  editor.setOption( "tabSize", form.value );
}


/* --UTILITY FUNCTIONS-- */
// Recursive file listing function
var _listProjectFiles_items = 0;
var _listProjectFiles_warned = false;
function listProjectFiles(root_dir, jstree_parent)
{
  if(_listProjectFiles_items < PROJECT_MAX_FILES)
  {
    fs.readdir(root_dir, (err, files) => {
      // Read folders
      files.forEach(file => {
        if( fs.statSync( root_dir + "/" + file ).isDirectory() ) 
        {
          var dir = $("#fileview-project-tree").jstree("create_node", jstree_parent, { text: file, icon: "source/resources/folder.png", a_attr: { href: "../" + root_dir + "/" + file }, data: { srcpath: (root_dir + "/" + file) } }, "last", false, false);
          ++_listProjectFiles_items;
        
          listProjectFiles(root_dir + "/" + file, dir); // Recursive function call
        }
      });
      // Read files
      files.forEach(file => {
        if( !fs.statSync( root_dir + "/" + file).isDirectory() ) 
        {
          $("#fileview-project-tree").jstree("create_node", jstree_parent, { text: file, icon: "source/resources/file-unknown.png", a_attr: { href: "../" + root_dir + "/" + file } }, "last", false, false);
          ++_listProjectFiles_items;
        }
      });
    });
  } else 
  {
    if(!_listProjectFiles_warned)
      alert("WARNING: This project contains too many files [over " + PROJECT_MAX_FILES + "] to display!\nChange your project settings to adjust the limit!");
      _listProjectFiles_warned = true;
  }
}

// Resizable sidebar through dragbar
var dragging = false;
$("#fileview-dragbar").mousedown(function(e)
{
  e.preventDefault();
  dragging = true;
  $(document).mousemove(function(e)
  {
    if(dragging)
    {
      $("#fileview").css("width", e.pageX);
    }
  });
});
$(document).mouseup(function(e)
{
    dragging = false;
});