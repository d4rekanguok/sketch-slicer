export default function (context) {
  const doc = context.document;
  let selected = context.selection

  selected.forEach(layer => {
    slice(layer, 0)
  })
  doc.showMessage('sliced ' + selected.length + ' layers.')
}

function slice (layer, padding) {
  //create a group from layer
  // log(layer.frame())
  var layers = MSLayerArray.arrayWithLayer(layer)
  var group = MSLayerGroup.groupFromLayers(layers)
  group.setName(layer.name() + '_export')

  var slice = MSSliceLayer.sliceLayerFromLayer(layer)
  slice.setName(layer.name())
  var frame = slice.frame()
  var layerFrame = layer.frame()
  // log(frame)
  frame.setX(layerFrame.x() - padding)
  frame.setY(layerFrame.y() - padding)
  frame.setWidth(layer.frame().width() + padding*2)
  frame.setHeight(layer.frame().height() + padding*2)
  log(frame)
  //set slice to only do content
  slice.exportOptions().setLayerOptions(2)
  context.document.reloadInspector()
  group.layerDidEndResize()

  return slice
}
