import React, { useState } from 'react';
import Switch from '@mui/material/Switch';
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faPlusCircle } from "@fortawesome/free-solid-svg-icons";
import '../styles/AdminTableStyle.css';
import '../styles/AdminPointsStyle.css';

const AddOption = ({AddOptionfn}) => {
    const [checked, setChecked] = useState(false);
    const [texte, setText] = useState("");
    const [texte_error, settexte_error] = useState(false);

    const handleChange = (event) => {
      setChecked(event.target.checked);
    };

    const handleSubmit = (e) => {
      if (e) e.preventDefault();

      if (texte.length === 0) {
        settexte_error(true);
      } else {
        const t = texte;
        const correct = checked;
        settexte_error(false);
        setText("");
        setChecked(false);
        document.getElementById("texte").value = "";
        AddOptionfn(t, correct);
      }
    }



return (
  <div className="option-form" style={{ marginBottom: '20px' }}>
    <div style={{ display: 'flex', flexWrap: 'wrap', alignItems: 'center', gap: '15px', marginBottom: '10px' }}>
      <div style={{ flex: '1', minWidth: '250px' }}>
        <input
          type="text"
          id="texte"
          placeholder="Enter option text"
          name="texte"
          className="form-control"
          onChange={(e) => setText(e.target.value)}
          style={{
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
            width: '100%',
            fontSize: '14px'
          }}
        />
      </div>
      <div style={{ display: 'flex', alignItems: 'center', minWidth: '150px' }}>
        <Switch
          checked={checked}
          onChange={handleChange}
          color="primary"
        />
        <span style={{ marginLeft: '5px', fontSize: '14px' }}>Correct answer</span>
      </div>
      <div>
        <button
          type="button"
          className="action-btn add"
          onClick={handleSubmit}
          style={{ padding: '8px 15px', display: 'flex', alignItems: 'center', gap: '5px' }}
        >
          <FontAwesomeIcon icon={faPlusCircle} /> Add
        </button>
      </div>
    </div>

    {texte_error && (
      <div className="alert alert-danger" role="alert" style={{ marginTop: '8px', fontSize: '14px' }}>
        Option text is required
      </div>
    )}
  </div>
)
}
export default AddOption;