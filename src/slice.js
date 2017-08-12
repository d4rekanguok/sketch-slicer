export default function (context) {
  const doc = context.document;
  let selected = context.selection;
  if (selected.length == 0){
    doc.showMessage('select at least one layer.')
    return
  }

  let option = setting(selected.length, 'Slice with Padding', 'Enter Padding (e.g: 10, or 10/10/10/10)');

  selected.forEach(layer => {
    slice(layer, option);
  })
  doc.showMessage('sliced ' + selected.length + ' layer(s).');
}

function setting (amount, title, helptext) {
  let alert = COSAlertWindow.new();
  alert.setMessageText(title);
  alert.addButtonWithTitle('Slice '+ amount +' layer(s)');
  alert.addButtonWithTitle('Cancel');
  alert.addTextLabelWithValue('Enter Padding (e.g: 10, or 10/10/10/10)');
  alert.addTextFieldWithValue('0');

  // userInterface.setIcon(NSImage.alloc().initByReferencingFile(context.plugin.urlForResourceNamed("icon.png").path()));
  // Symbol button
  let button = NSButton.alloc().initWithFrame(NSMakeRect(0, 0, 200.0, 25.0));
  button.setButtonType(NSSwitchButton);
  button.setTitle('Create Symbol')

  alert.addAccessoryView(button)



  let userInput = alert.runModal()
  if (userInput == "1000") {

    let padding, symbol;
    const paddingData = alert.viewAtIndex(1).stringValue().split('/').map(data => parseInt(data, 10));
    switch (paddingData.length){
      case 1:
        padding = {
          top: paddingData[0],
          right: paddingData[0],
          bottom: paddingData[0],
          left: paddingData[0]
        }
        break;
      case 2:
        padding = {
          top: paddingData[0],
          bottom: paddingData[0],
          right: paddingData[1],
          left: paddingData[1]
        }
        break;
      case 3:
        padding = {
          top: paddingData[0],
          bottom: paddingData[2],
          right: paddingData[1],
          left: paddingData[1]
        }
        break;
      case 4:
      padding = {
        top: paddingData[0],
        right: paddingData[1],
        bottom: paddingData[2],
        left: paddingData[3]
      }
      break;
    }

    if (alert.viewAtIndex(2).state() == 1){
      symbol = true;
    } else {
      symbol = false;
    }

    return {
      padding,
      symbol
    }
  }

  return
}

function slice (layer, option) {
  log(option)
  const name = layer.name();
  const layers = MSLayerArray.arrayWithLayer(layer);
  const group = MSLayerGroup.groupFromLayers(layers);
  group.setName(name + '_export');

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
    sliceFrame.setX(layerFrame.x() - padding.left);
    sliceFrame.setY(layerFrame.y() - padding.top);
    sliceFrame.setWidth(layerFrame.width() + padding.left + padding.right);
    sliceFrame.setHeight(layerFrame.height() + padding.top + padding.bottom);

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
