import React, { useState } from 'react';
import { useForm } from "react-hook-form";
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from "yup";
import AddOption from "./AddOption";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faMinusCircle } from "@fortawesome/free-solid-svg-icons";
import CodeEditor from '@uiw/react-textarea-code-editor';

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
        <input type="text" className="form-control" id="title" {...register("texte")} placeholder="Question text" />
      </div>
      <div className="alert alert-danger" role="alert" hidden={!errors.texte}>
        {errors.texte?.message}
      </div>

      <div className="form-group my-3">
        {!insertCode && (
          <a className="btn btn-secondary" onClick={() => setInsertCode(true)}>Insert Code block</a>
        )}

        {insertCode && (
          <div>
            <a className="btn btn-danger col-2 me-2 my-3" onClick={() => setInsertCode(false)}>Close editor</a>
            <a className="btn btn-secondary col-2 me-2 my-3" onClick={() => setCode("")}>Clear editor</a>
            <select className="btn btn-light col-5" onChange={(e) => setlanguage(e.target.value)}>
              <option value="c">Language: c</option>
              <option value="javascript">Language: javascript</option>
              <option value="python">Language: python</option>
              <option value="java">Language: java</option>
              {/* Add other language options as needed */}
            </select>
            <CodeEditor
              value={code}
              language={language}
              placeholder={`Please enter ${language} code.`}
              onChange={(evn) => setCode(evn.target.value)}
              padding={15}
              style={{
                fontSize: 12,
                backgroundColor: "#f5f5f5",
                fontFamily: "ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace"
              }}
            />
          </div>
        )}
      </div>

      <div className="form-group my-3">
        <select className="form-control" {...register("QuestionType")}>
          <option value="CheckBox">CheckBox</option>
          <option value="Radio">Radio</option>
          <option value="Select">Select</option>
        </select>

        <div className="col-9 ms-2 my-2">
          {responses.length > 0 && <h6 className="my-2">Options</h6>}
          {responses.map((reponse, index) => (
            <div className="row" key={index}>
              <p className="col-8">{reponse.texte}</p>
              <p className="col-3">
                {reponse.correct ? "Correct Answer" : "False Answer"}
              </p>
              <a className="col" onClick={() => deleterep(index)}>
                <FontAwesomeIcon style={{ color: "red" }} icon={faMinusCircle} />
              </a>
            </div>
          ))}
        </div>

        <h6 className="my-2">Add Options</h6>
        <AddOption AddOptionfn={AddOptionfn} />
        
        {Errorinoptions && (
          <div className="alert alert-danger" role="alert">
            {ErrorinoptionsMsg}
          </div>
        )}
      </div>

      <div className="form-group my-3">
        <input type="submit" value="Save" className="form-control btn btncustom" />
      </div>
    </form>
  );
}

export default AddQuestion;