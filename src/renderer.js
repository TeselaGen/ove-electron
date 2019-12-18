const { currentWindow } = window;
const seqDataToUse = currentWindow.initialSeqJson || { circular: true };
// export default generateSequenceData()
const originalTitle = document.title;

setNewTitle(seqDataToUse.name);

function setNewTitle(name) {
  document.title = originalTitle + " -- " + (name || "Untitled Sequence");
}

const handleSave = isSaveAs => (
  event,
  sequenceDataToSave,
  editorProps,
  onSuccessCallback
) => {
  let newFilePath;
  if (isSaveAs || !window.filePath) {
    //we need to get the newFilePath
    const filename = `${sequenceDataToSave.name || "Untitled_Sequence"}.gb`;
    newFilePath = window.dialog.showSaveDialogSync({
      title: filename,
      defaultPath:
        (window.filePath
          ? window.filePath.slice(0, window.filePath.lastIndexOf("/") + 1)
          : "~/Downloads/") + filename,
      buttonLabel: "Save file"
    });
    if (!newFilePath) {
      return; //cancel the save!
    }
    if (
      !sequenceDataToSave.name ||
      sequenceDataToSave.name === "Untitled_Sequence" ||
      sequenceDataToSave.name === "Untitled Sequence"
    ) {
      sequenceDataToSave.name = newFilePath
        .slice(newFilePath.lastIndexOf("/") + 1)
        .replace(".gb", "");

      setNewTitle(sequenceDataToSave.name);
    }
    editor.updateEditor({
      //update the name of the seq without triggering the undo/redo stack tracking
      sequenceData: sequenceDataToSave
    });

    window.filePath = newFilePath;
    
  } else {
    //normal save
    newFilePath = window.filePath;
  }
  const formattedSeqString = window.jsonToGenbank(sequenceDataToSave);
  window.ipcRenderer.send("ove_onSave", {
    filePath: newFilePath,
    formattedSeqString
  });
  onSuccessCallback();
  window.toastr.success(`Sequence Saved to ${newFilePath}`)
};

const editor = window.createVectorEditor("createDomNodeForMe", {
  isFullscreen: true,
  // or you can pass "createDomNodeForMe" but make sure to use editor.close() to clean up the dom node!

  //you can also pass a DOM node as the first arg here
  // showReadOnly: false,
  // disableSetReadOnly: true,
  shouldAutosave: false,
  alwaysAllowSave: true,
  // rightClickOverrides: {
  //   selectionLayerRightClicked: (items /* { annotation }, props */) => {
  //     return [
  //       ...items,
  //       {
  //         text: "Create Part",
  //         onClick: () => console.info("hey!≈")
  //       }
  //     ];
  //   }
  // },
  // handleFullscreenClose: () => { //comment this function in to make the editor fullscreen by default
  //   editor.close() //this calls reactDom.unmountComponent at the node you passed as the first arg
  // },
  onRename: newName => {
    setNewTitle(newName);
  }, //this option should be shown by default
  // onNew: () => {}, //unless this callback is defined, don't show the option to create a new seq
  // onDuplicate: () => {}, //unless this callback is defined, don't show the option to create a new seq
  onSaveAs: handleSave(true),
  onSave: handleSave(),
  // onDelete: data => {
  //   console.warn("would delete", data);
  // },
  // onCopy: function(event, copiedSequenceData /* , editorState */) {
  //   //the copiedSequenceData is the subset of the sequence that has been copied in the teselagen sequence format
  //   const clipboardData = event.clipboardData;
  //   clipboardData.setData("text/plain", copiedSequenceData.sequence);
  //   clipboardData.setData(
  //     "application/json",
  //     //for example here you could change teselagen parts into jbei parts
  //     JSON.stringify(copiedSequenceData)
  //   );
  //   event.preventDefault();
  //   //in onPaste in your app you can do:
  //   // e.clipboardData.getData('application/json')
  // },
  // onPaste: function(event /* , editorState */) {
  //   //the onPaste here must return sequenceData in the teselagen data format
  //   const clipboardData = event.clipboardData;
  //   let jsonData = clipboardData.getData("application/json");
  //   if (jsonData) {
  //     jsonData = JSON.parse(jsonData);
  //     if (jsonData.isJbeiSeq) {
  //       jsonData = convertJbeiToTeselagen(jsonData);
  //     }
  //   }
  //   const sequenceData = jsonData || {
  //     sequence: clipboardData.getData("text/plain")
  //   };
  //   return sequenceData;
  // },
  // getSequenceAtVersion: versionId => {
  //   if (versionId === 2) {
  //     return {
  //       sequence: "thomaswashere"
  //     };
  //   } else if ((versionId = 3)) {
  //     return {
  //       features: [{ start: 4, end: 6 }],
  //       sequence:
  //         "GGGAAAagagagtgagagagtagagagagaccacaccccccGGGAAAagagagtgagagagtagagagagaccacaccccccGGGAAAagagagtgagagagtagagagagaccacaccccccGGGAAAagagagtgagagagtagagagagaccacacccccc"
  //     };
  //   } else {
  //     console.error("we shouldn't be here...");
  //     return {
  //       sequence: "taa"
  //     };
  //   }
  // },
  // getVersionList: () => {
  //   return [
  //     {
  //       dateChanged: "12/30/2211",
  //       editedBy: "Nara",
  //       // revisionType: "Sequence Deletion",
  //       versionId: 2
  //     },
  //     {
  //       dateChanged: "8/30/2211",
  //       editedBy: "Ralph",
  //       // revisionType: "Feature Edit",
  //       versionId: 3
  //     }
  //   ];
  // },
  showMenuBar: true,
  PropertiesProps: {
    propertiesList: [
      "general",
      "features",
      "parts",
      "primers",
      "translations",
      "cutsites",
      "orfs",
      "genbank"
    ]
  },
  ToolBarProps: {
    toolList: [
      "saveTool",
      "downloadTool",
      "importTool",
      "undoTool",
      "redoTool",
      "cutsiteTool",
      "featureTool",
      "alignmentTool",
      "versionHistoryTool",
      // "oligoTool",
      "orfTool",
      // "viewTool",
      "editTool",
      "findTool",
      "visibilityTool"
      // "propertiesTool"
    ]
  }
}); /* createDomNodeForMe will make a dom node for you and append it to the document.body*/

const isCircular = seqDataToUse && seqDataToUse.circular;
editor.updateEditor({
  sequenceData: seqDataToUse,
  sequenceDataHistory: {}, //clear the sequenceDataHistory if there is any left over from a previous sequence
  annotationVisibility: {
    // features: false,
    orfTranslations: false
  },
  readOnly: false,
  panelsShown: [
    [
      {
        // fullScreen: true,
        active: !!isCircular,
        id: "circular",
        name: "Circular Map"
      },
      {
        id: "rail",
        name: "Linear Map",
        active: !isCircular
      }
    ],
    [
      {
        id: "sequence",
        name: "Sequence Map",
        active: true
      },

      {
        id: "properties",
        name: "Properties"
      }
    ]
  ],
  annotationsToSupport: {
    //these are the defaults, change to false to exclude
    features: true,
    translations: true,
    parts: true,
    orfs: true,
    cutsites: true,
    primers: false
  }
});
// ************************************************************************
// this function is super handy for debugging what is happening
// in the main process from the renderer process !!
//you'll need to comment it in in main.js also1
// setInterval(() => {
//   console.log(`currentWindow.logs:`,currentWindow.logs)
// }, 5000);
// ************************************************************************
