// Src https://github.com/fedosejev/checkboxes-in-react-16/blob/master/src/components/Checkbox.js
import React from "react";

const Checkbox = ({ label, isSelected, onCheckboxChange, value }) => (
  <div className="form-check">
    <label>
      <input
        type="checkbox"
        name={label}
        checked={isSelected}
        onChange={onCheckboxChange}
        value={value}
        className="form-check-input"
      />
      {label}
    </label>
  </div>
);

export default Checkbox;
