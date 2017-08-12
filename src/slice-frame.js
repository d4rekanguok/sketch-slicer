import Slice from './slice'

export default function (context) {
  const doc = context.document;
  let selected = context.selection;
  if (selected.length == 0){
    doc.showMessage('select at least one layer.')
    return
  }

  let option = Slice.setting(selected.length, 'Slice with Frame', 'Enter Frame (e.g: 24, or 24/24)');

  selected.forEach(layer => {
    Slice.slice(layer, option);
  })
  doc.showMessage('sliced ' + selected.length + ' layer(s).');
}
