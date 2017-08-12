export default function (context) {
  const doc = context.document
  let selected = context.selection
  if (selected.length == 0){
    doc.showMessage('select at least one layer.')
    return
  }

  option = {
    frame: 32
  }

  selected.forEach(layer => {
    slice(layer, option)
  })
  doc.showMessage('sliced ' + selected.length + ' layer(s).')
}

function slice (layer, option) {
  const name = layer.name();
  const layers = MSLayerArray.arrayWithLayer(layer);
  const group = MSLayerGroup.groupFromLayers(layers);
  group.setName(name + '_export')

  const slice = MSSliceLayer.sliceLayerFromLayer(layer);
  slice.setName(name)

  let sliceFrame = slice.frame();
  let layerFrame = layer.frame();

  if (option.hasOwnProperty('padding')){

    let padding;
    let temp_padding = option.padding;
    //
    if (typeof option.padding == "number"){
      padding = {
        top: temp_padding,
        right: temp_padding,
        bottom: temp_padding,
        left: temp_padding
      }
    } else {
      padding = Object.assign({
        top: 0,
        right: 0,
        bottom: 0,
        left: 0
      }, temp_padding)
    }
    sliceFrame.setX(layerFrame.x() - padding.left)
    sliceFrame.setY(layerFrame.y() - padding.top)
    sliceFrame.setWidth(layerFrame.width() + padding.left + padding.right)
    sliceFrame.setHeight(layerFrame.height() + padding.top + padding.bottom)

  } else if (option.hasOwnProperty('frame')){

    let frame;
    let temp_frame = option.frame;

    if (typeof option.frame == "number"){
      frame = {
        width: temp_frame,
        height: temp_frame
      }
    } else {
      // use layer's width and height as default
      frame = Object.assign({
        width: layerFrame.width(),
        height: layerFrame.height()
      }, option.frame);
    }
    sliceFrame.setWidth(frame.width);
    sliceFrame.setHeight(frame.height);
    const sliceX = (layerFrame.width() - sliceFrame.width()) / 2;
    const sliceY = (layerFrame.height() - sliceFrame.height()) / 2;
    const sliceXFloor = Math.floor(sliceX);
    const sliceYFloor = Math.floor(sliceY);
    sliceFrame.setX(sliceXFloor);
    sliceFrame.setY(sliceYFloor);

    //adjust layer so it's placed in the middle of the slice
    const sliceXleftover = sliceX - sliceXFloor;
    const sliceYleftover = sliceY - sliceYFloor;
    if (sliceXleftover !== 0 || sliceYleftover !== 0){
      layerFrame.setX(layerFrame.x() - sliceXleftover);
      layerFrame.setY(layerFrame.y() - sliceYleftover);
    }
  }

  //set slice to only do content
  slice.exportOptions().setLayerOptions(2);
  context.document.reloadInspector();

  // resize group
  group.layerDidEndResize();

  // create symbol
  if (option.hasOwnProperty('symbol') && option.symbol){
    const groups = MSLayerArray.arrayWithLayers([slice, layer]);
    if (MSSymbolCreator.canCreateSymbolFromLayers(groups)){
      MSSymbolCreator.createSymbolFromLayers_withName_onSymbolsPage(groups, name, true);
      group.ungroup();
    }
  }

  return slice
}
