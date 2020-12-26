import * as Annotorious from '@recogito/annotorious-openseadragon';
import * as MobileNet from '@tensorflow-models/mobilenet';
import * as KNNClassifier from '@tensorflow-models/knn-classifier';
import OpenSeadragon from 'openseadragon';

import '@tensorflow/tfjs';

import '@recogito/annotorious-openseadragon/dist/annotorious.min.css';

(async function() {
  // Initialize OSD viewer
  const viewer = OpenSeadragon({
    id: "openseadragon",
    prefixUrl: "/osd/",
    tileSources: {
      type: "image",

      // Attribution: Carta Marina by Olaus Magnus (1539)
      // https://commons.wikimedia.org/wiki/File:Carta_Marina.jpeg
      url: "/Carta_Marina.jpeg" 
    }
  });

  // Initialize the Annotorious plugin
  var anno = Annotorious(viewer, {
    widgets: [ 'TAG' ]
  });

  console.log('Loading MobileNet');
  console.time('MobileNet loaded');
  const mnet = await MobileNet.load();
  console.timeEnd('MobileNet loaded');

  const classifier = KNNClassifier.create();

  // When the user creates a new selection, we'll classify the snippet
  anno.on('createSelection', async function(selection) {
    if (classifier.getNumClasses() > 1) {
      const { snippet } = anno.getSelectedImageSnippet();

      const activation = mnet.infer(snippet, 'conv_preds');
      const result = await classifier.predictClass(activation);

      if (result) {
        // Inject into the current annotation
        selection.body = [{
          type: 'TextualBody',
          purpose: 'tagging',
          value: result.label
        }]

        anno.updateSelected(selection);
      }
    }
  });

  // When the user hits 'Ok', we'll store the snippet as a new example
  anno.on('createAnnotation', function(annotation) {
    const { snippet } = anno.getSelectedImageSnippet();
    const tag = annotation.body.find(b => b.purpose === 'tagging').value;

    // See https://codelabs.developers.google.com/codelabs/tensorflowjs-teachablemachine-codelab/index.html#6
    const activation = mnet.infer(snippet, true);
    classifier.addExample(activation, tag);
  });
})();