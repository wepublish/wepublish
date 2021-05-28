import React from 'react'

// import {BaseEmoji, Picker} from 'emoji-mart'
// import {Picker} from

interface QuotationMarksPickerProps {
  setQuotationMarks: (quotationMarks: string) => void
}

export function QuotationMarksPicker({setQuotationMarks}: QuotationMarksPickerProps) {
  return (
    <menu
        // onChange={e => {
        //   setQuotationMarks()
        // }}
      style={{cursor: 'pointer'}}>
      <button> {"<< >>"} </button>
      <button> {"< >"} </button>
      <button> {"' '"} </button>
    </menu>
    // <Menu
    //   id="simple-menu"
    //   anchorEl={anchorEl}
    //   keepMounted
    //   open={Boolean(anchorEl)}
    //   onClose={handleClose}>
    //   <MenuItem onClick={handleClose}>Profile</MenuItem>
    //   <MenuItem onClick={handleClose}>My account</MenuItem>
    //   <MenuItem onClick={handleClose}>Logout</MenuItem>
    // </Menu>
  )
}

// import Dropdown from 'react-dropdown';
// import 'react-dropdown/style.css';

// const options = [
//   'one', 'two', 'three'
// ];
// const defaultOption = options[0];

// export function QuotationMarksPicker() {
//   return (
//     <Dropdown options={options} onChange={this._onSelect} value={defaultOption} placeholder="Select an option" />
//   )
// }
