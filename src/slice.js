const settingText = {
  padding: {
    title: 'Slice with Padding',
    helper: 'Enter padding (e.g: 10, or 10;10;10;10)',
    defaultValue: 0,
    icon: 'sliceWithPadding.png'
  },
  frame: {
    title: 'Slice with Frame',
    helper: 'Enter frame dimension (e.g: 24, or 24;24)',
    defaultValue: 24,
    icon: 'sliceWithFrame.png'
  }
}

export default Slice = {
  slice: function (layer, option) {

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
      sliceFrame.setX(Math.floor(layerFrame.x() - padding.left));
      sliceFrame.setY(Math.floor(layerFrame.y() - padding.top));
      sliceFrame.setWidth(Math.ceil(layerFrame.width() + padding.left + padding.right));
      sliceFrame.setHeight(Math.ceil(layerFrame.height() + padding.top + padding.bottom));

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

    //use preset
    if (option.hasOwnProperty('preset')){
      slice.exportOptions().setExportFormats(option.preset);
    }

    // create symbol
    if (option.hasOwnProperty('symbol') && option.symbol){
      const groups = MSLayerArray.arrayWithLayers([slice, layer]);
      if (MSSymbolCreator.canCreateSymbolFromLayers(groups)){
        MSSymbolCreator.createSymbolFromLayers_withName_onSymbolsPage(groups, name, true);
        group.ungroup();
      }
    }

    return slice
  },

  //get user input & return option
  setting: function (type, amount) {
    let alert = COSAlertWindow.new();
    alert.setMessageText(settingText[type].title);
    alert.addButtonWithTitle('Slice '+ amount +' layer(s)');
    alert.addButtonWithTitle('Cancel');

    alert.addTextLabelWithValue(settingText[type].helper);
    alert.addTextFieldWithValue(settingText[type].defaultValue);

    alert.setIcon(NSImage.alloc().initByReferencingFile(context.plugin.urlForResourceNamed(settingText[type].icon).path()));

    alert.addTextLabelWithValue('Select an export preset');
    alert.addAccessoryView(this.presetDropdown())

    // Symbol button
    let button = NSButton.alloc().initWithFrame(NSMakeRect(0, 0, 200.0, 25.0));
    button.setButtonType(NSSwitchButton);
    button.setTitle('Create Symbol')
    alert.addAccessoryView(button)

    let userInput = alert.runModal()
    if (userInput == "1000") {

      let set, preset, symbol;
      const setData = alert.viewAtIndex(1).stringValue().split(';').map(data => parseInt(data, 10));
      if (type === 'padding'){
        switch (setData.length){
          case 1:
            set = {
              top: setData[0],
              right: setData[0],
              bottom: setData[0],
              left: setData[0]
            }
            break;
          case 2:
            set = {
              top: setData[0],
              bottom: setData[0],
              right: setData[1],
              left: setData[1]
            }
            break;
          case 3:
            set = {
              top: setData[0],
              bottom: setData[2],
              right: setData[1],
              left: setData[1]
            }
            break;
          case 4:
          set = {
            top: setData[0],
            right: setData[1],
            bottom: setData[2],
            left: setData[3]
          }
          break;
        }
      } else if (type === 'frame'){
        switch (setData.length){
          case 1:
            set = {
              width: setData[0],
              height: setData[0]
            }
            break;
          case 2:
            set = {
              width: setData[0],
              height: setData[1]
            }
        }
      }

      // get preset option
      const selectedPresetId = alert.viewAtIndex(3).indexOfSelectedItem()
      preset = MSExportPreset.allExportPresets()[selectedPresetId].exportFormats()
      // get symbol switch button state
      if (alert.viewAtIndex(4).state() == 1){
        symbol = true;
      } else {
        symbol = false;
      }

      return {
        [type]: set,
        preset,
        symbol
      }
    }

    return
  },

  presetDropdown: function() {

    let values = [];
    let presets = MSExportPreset.allExportPresets();
    for (var i = 0; i < presets.length; i++) {
      values.push(presets[i].name());
    }

    let dropdown = NSPopUpButton.alloc().initWithFrame(NSMakeRect(0, 0, 200, 28));
    dropdown.addItemsWithTitles(values);

    return dropdown
  }
}
