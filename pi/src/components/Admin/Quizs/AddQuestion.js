import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from "yup";
import AddOption from "./AddOption";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinusCircle } from "@fortawesome/free-solid-svg-icons";
import CodeEditor from '@uiw/react-textarea-code-editor';
import '../styles/AdminTableStyle.css';
import '../styles/AdminPointsStyle.css';

const schema = yup.object({
  texte: yup.string().required(),
}).required();

const AddQuestion = ({ quiz, onAddQuestion }) => {
  const [responses, setResponses] = useState([]);
  const [Errorinoptions, setErrorinoptions] = useState(false);
  const [ErrorinoptionsMsg, setErrorinoptionsMsg] = useState("");
  const [insertCode, setInsertCode] = useState(false);
  const [code, setCode] = useState("");
  const [language, setlanguage] = useState("c");

  const { register, handleSubmit, formState: { errors }, reset } = useForm({
    resolver: yupResolver(schema)
  });

  function AddOptionfn(texte, correct) {
    setResponses([...responses, { texte, correct }]);
  }

  const onSubmit = (data) => {
    if (responses.filter((e) => e.correct === true).length === 0) {
      setErrorinoptions(true);
      setErrorinoptionsMsg("Question must have at least one Correct Answer");
    } else if ((data.QuestionType === "Radio" || data.QuestionType === "Select") && (responses.filter((e) => e.correct === true).length > 1)) {
      setErrorinoptions(true);
      setErrorinoptionsMsg("This Type of Question must have only one Correct Answer");
    } else {
      setErrorinoptions(false);
      setErrorinoptionsMsg("");

      onAddQuestion(data, responses, code, language);

      setResponses([]);
      setInsertCode(false);
      setCode("");
      setlanguage("c");
      reset();
    }
  }

  function deleterep(index) {
    setResponses([
      ...responses.slice(0, index),
      ...responses.slice(index + 1)
    ]);
  }

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="form-group my-3">
        <label className="form-label" style={{ fontWeight: 'bold', color: '#3b82f6', marginBottom: '8px', display: 'block' }}>
          Question Text
        </label>
        <input
          type="text"
          className="form-control"
          id="title"
          {...register("texte")}
          placeholder="Enter your question here"
          style={{
            padding: '12px',
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
            width: '100%',
            fontSize: '14px',
            marginBottom: errors.texte ? '0' : '15px'
          }}
        />
        {errors.texte && (
          <div className="alert alert-danger" role="alert" style={{ marginTop: '8px', fontSize: '14px' }}>
            {errors.texte?.message || "Question text is required"}
          </div>
        )}
      </div>

      <div className="form-group my-3">
        {!insertCode && (
          <button type="button" className="action-btn add" onClick={() => setInsertCode(true)}>Insert Code block</button>
        )}

        {insertCode && (
          <div>
            <div className="code-editor-controls">
              <button type="button" className="action-btn cancel" onClick={() => setInsertCode(false)}>Close editor</button>
              <button type="button" className="action-btn modify" onClick={() => setCode("")}>Clear editor</button>
              <select
                className="code-language-select"
                onChange={(e) => setlanguage(e.target.value)}
                style={{
                  padding: '8px 12px',
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0',
                  marginLeft: '10px',
                  fontSize: '14px'
                }}
              >
                <option value="c">Language: c</option>
                <option value="javascript">Language: javascript</option>
                <option value="python">Language: python</option>
                <option value="java">Language: java</option>
                {/* Add other language options as needed */}
              </select>
            </div>
            <div style={{ marginTop: '10px' }}>
              <CodeEditor
                value={code}
                language={language}
                placeholder={`Please enter ${language} code.`}
                onChange={(evn) => setCode(evn.target.value)}
                padding={15}
                style={{
                  fontSize: 14,
                  backgroundColor: "#f8fafc",
                  fontFamily: "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace",
                  borderRadius: '4px',
                  border: '1px solid #e2e8f0'
                }}
              />
            </div>
          </div>
        )}
      </div>

      <div className="form-group my-3">
        <label className="form-label">Question Type</label>
        <select
          className="form-control"
          {...register("QuestionType")}
          style={{
            padding: '10px',
            borderRadius: '4px',
            border: '1px solid #e2e8f0',
            marginBottom: '15px',
            fontSize: '14px',
            width: '100%'
          }}
        >
          <option value="CheckBox">CheckBox (Multiple correct answers)</option>
          <option value="Radio">Radio (Single correct answer)</option>
          <option value="Select">Select (Dropdown selection)</option>
        </select>

        <div className="options-container" style={{ marginTop: '20px', marginBottom: '20px' }}>
          {responses.length > 0 && (
            <div>
              <h6 className="my-3" style={{ fontWeight: 'bold', color: '#3b82f6' }}>Answer Options</h6>
              <div className="options-list" style={{
                backgroundColor: '#f8fafc',
                borderRadius: '8px',
                padding: '10px',
                marginBottom: '20px'
              }}>
                {responses.map((reponse, index) => (
                  <div
                    className="option-item"
                    key={index}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      padding: '10px',
                      borderBottom: index < responses.length - 1 ? '1px solid #e2e8f0' : 'none',
                      backgroundColor: reponse.correct ? 'rgba(16, 185, 129, 0.1)' : 'transparent'
                    }}
                  >
                    <div style={{ flex: '1' }}>
                      <p style={{ margin: '0', fontWeight: '500' }}>{reponse.texte}</p>
                    </div>
                    <div style={{
                      padding: '4px 8px',
                      borderRadius: '4px',
                      backgroundColor: reponse.correct ? 'rgba(16, 185, 129, 0.2)' : 'rgba(239, 68, 68, 0.1)',
                      color: reponse.correct ? '#10b981' : '#ef4444',
                      marginRight: '10px',
                      fontSize: '12px',
                      fontWeight: '500'
                    }}>
                      {reponse.correct ? "Correct" : "Incorrect"}
                    </div>
                    <button
                      type="button"
                      className="action-btn delete"
                      onClick={() => deleterep(index)}
                      style={{ padding: '4px 8px', minWidth: 'auto' }}
                    >
                      <FontAwesomeIcon icon={faMinusCircle} />
                    </button>
                  </div>
                ))}
              </div>
            </div>
          )}

          <h6 className="my-3" style={{ fontWeight: 'bold', color: '#3b82f6' }}>Add New Option</h6>
          <AddOption AddOptionfn={AddOptionfn} />

          {Errorinoptions && (
            <div className="alert alert-danger" role="alert" style={{ marginTop: '15px' }}>
              {ErrorinoptionsMsg}
            </div>
          )}
        </div>
      </div>

      <div className="form-group my-4">
        <button type="submit" className="action-btn add" style={{ width: '100%', padding: '12px' }}>
          Save Question
        </button>
      </div>
    </form>
  );
}

export default AddQuestion;