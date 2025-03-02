import { Route, useNavigate, useParams } from "react-router-dom";
import React, { useState, useEffect } from 'react';
import { Badge, Card, Collapse, Table ,Modal,Button} from "react-bootstrap";
import AddQuiz from "./AddQuiz";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faTrash, faEdit, faClose, faCircleXmark, faCircleCheck, faGear, faXmark, faCheck, faArrowUp } from "@fortawesome/free-solid-svg-icons";
import 'react-confirm-alert/src/react-confirm-alert.css'; // Import CSS
import { Switch } from "@mui/material";
import AddQuestion from "./AddQuestion";
import Cookies from "js-cookie";  
import "../../../assets/css/styleQuiz.css";

// États manquants

const backendURL = "http://localhost:5001/api";

const QuizAdmin = () => {
    const [Quizselected, setQuizselected] = useState(null);
const [reloadquiz, setReloadquiz] = useState(false);
const [seTerroChronoval, setSeTerroChronoval] = useState(null);



    const history = useNavigate();
    let { idModule } = useParams();

    const [user, setUser] = useState(null);
    const [module, setModule] = useState(null);
    const [quizzes, setQuizzes] = useState([]);
    const [error, setError] = useState(null);
    const [ShowManagePopup, setShowManagePopup] = useState(false);

    const [openAdd, setopenAdd] = useState(false);
    const [showAddQuestion, setShowAddQuestion] = useState(false);
    const [quizSelected, setQuizSelected] = useState(false);
    const [editQuiz, setEditQuiz] = useState(false);
    const [keySelected, setKeySelected] = useState(false);
    const [checked, setChecked] = useState(false);
    const [erroChronoval, setErroChronoval] = useState(false);
// Fonctions manquantes
const ShowAddQuestion = () => {
    console.log("ShowAddQuestion function called");
  };
  
  const confirDeleteQuestion = () => {
    console.log("confirDeleteQuestion function called");
  };
  
  const confirmDelete = () => {
    console.log("confirmDelete function called");
  };
    // Charger l'utilisateur depuis les cookies
    useEffect(() => {
        const storedUser = Cookies.get("user");
        if (storedUser) {
            const parsedUser = JSON.parse(storedUser);
            console.log("User avec cookie:", parsedUser);
            setUser(parsedUser);
        }
    }, []);

    // Charger le module
   
useEffect(() => {

 
      // Charger les quiz
      const fetchQuizzes = async () => {
          try {
              console.log("Fetching quizzes...");

              const response = await fetch(`${backendURL}/quiz/findall`, {
                  method: 'GET',
               
              });

              // Vérification de la réponse
              console.log("Response object:", response);

              if (!response.ok) {
                  throw new Error("Échec du chargement des quiz");
              }

              // Parser la réponse en JSON
              const data = await response.json();
              console.log("Data received:", data); // Vérifier ce que vous recevez

              // Mettre à jour l'état avec les données reçues
              setQuizzes(data);
          } catch (err) {
              setError(err.message);
          }
      };

      fetchQuizzes();

  
}, []);

    // Charger les quiz
    useEffect(() => {
      const fetchQuizzes = async () => {
       
          try {
              const response = await fetch(`${backendURL}/quiz/findall`, {
                  method: 'GET',
             
              });
  
              // Affichage de la réponse brute pour déboguer
              console.log("Response object:", response);
  
              // Vérifier que la réponse est correcte
              if (!response.ok) {
                  throw new Error("Échec du chargement des quiz");
              }
  
              // Parser la réponse en JSON
              const data = await response.json();
              console.log("Data received:", data); // Vérifier ce que vous recevez
  
              // Mettre à jour l'état avec les données reçues
              setQuizzes(data);
          } catch (err) {
              setError(err.message);
          }
      };
  
      fetchQuizzes();
      if (reloadquiz) {
        // Fetch quizzes again or perform any other action to reload
        // Assuming `fetchQuizzes` is the function that loads quizzes
        fetchQuizzes();
        // Reset reloadquiz to false after the quizzes are fetched
        setReloadquiz(false);
    }
  }, [user],[reloadquiz]);
  

    // Vérifier si l'utilisateur est propriétaire du module
    useEffect(() => {
        if (module && user && module.idowner !== user.id) {
            let url = `/module/${idModule}/allcours`;
            history.push(url);
        }
    }, [module, user, idModule, history]);

    // Gestion de la mise à jour du quiz
    const handleChange = async (event) => { 
        setChecked(event.target.checked);

        if (!event.target.checked) {
            try {
             

                const response = await fetch(`${backendURL}/quiz/update`, {
                    method: 'PATCH',
                    headers: {
                        'Content-Type': 'application/json',
                  },
                    body: JSON.stringify({
                        id: quizSelected._id,
                        chrono: false,
                        chronoVal: 0
                    })
                });

                if (!response.ok) {
                    throw new Error("Failed to update quiz");
                }

                // Recharger les quiz après mise à jour
                const updatedQuizzes = quizzes.map(q =>
                    q._id === quizSelected._id ? { ...q, chrono: false, chronoVal: 0 } : q
                );
                setQuizzes(updatedQuizzes);
            } catch (err) {
                console.error("Error updating quiz:", err.message);
            }
        }
    };
    const handleKeyPresstitle = async (event) => {
        if (event.key === 'Enter') {
          try {
            // Vérifier si l'utilisateur est défini
          
      
            const response = await fetch(`${backendURL}/quiz/update`, {
              method: 'PATCH',
              headers: {
                'Content-Type': 'application/json',
            },
              body: JSON.stringify({
                id: Quizselected._id,
                title: event.target.value
              })
            });
      
            if (!response.ok) {
              throw new Error("Failed to update quiz title");
            }
      
            reloadquiz();
          } catch (err) {
            console.error("Error updating quiz title:", err.message);
          }
        }
      };
      
      const handleKeyPresschrono = async (event) => {
        if (event.key === 'Enter') {
          if (event.target.value > 0) {
            try {
              // Vérifier si l'utilisateur est défini
         
              const response = await fetch(`${backendURL}/quiz/update`, {
                method: 'PATCH',
                headers: {
                  'Content-Type': 'application/json',
              },
                body: JSON.stringify({
                  id: Quizselected._id,
                  chrono: checked,
                  chronoVal: event.target.value
                })
              });
      
              if (!response.ok) {
                throw new Error("Failed to update quiz chrono value");
              }
      
              reloadquiz();
              seTerroChronoval(false);
            } catch (err) {
              console.error("Error updating quiz chrono value:", err.message);
            }
          } else {
            seTerroChronoval(true);
          }
        }
      };
      
      async function AddQuestionEvent(data, responses, code, language) {
        console.log("✅ AddQuestionEvent called with:", { data, responses, code, language, Quizselected });
      
        try {
          // Vérifier que quizSelected n'est pas null
          if (!Quizselected) {
            console.error("❌ No quiz selected. Please select a quiz before adding a question.");
            return;
          }
      
          // Construire le corps de la requête
          const requestBody = {
            texte: data.texte,
            QuestionType: data.QuestionType,
            Responses: responses,
          };
      
          // Ajouter `code` et `language` seulement si `code` n'est pas vide
          if (code !== "") {
            requestBody.code = code;
            requestBody.language = language;
          }
      
          console.log("📤 Sending request to:", `${backendURL}/quiz/addQuestion/${Quizselected._id}`);
          console.log("📝 Request body:", requestBody);
      
          const response = await fetch(`${backendURL}/quiz/addQuestion/${Quizselected._id}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(requestBody),
          });
      
          if (!response.ok) {
            throw new Error("Failed to add question");
          }
      
          const q = await response.json();
          console.log("✅ Question added successfully:", q);
          setQuizSelected(q); // Mise à jour de l'état après ajout
        } catch (err) {
          console.error("❌ Error adding question:", err.message);
        }
      }
      
      

      async function addQuizFn(data, timer) {
        try {
       
      
          // Construire le corps de la requête
          const requestBody = { title: data.title };
      
          // Ajouter `chrono` et `chronoVal` si `timer` est activé
          if (timer) {
            requestBody.chrono = true;
            requestBody.chronoVal = data.chrono;
          }
      
          const response = await fetch(`${backendURL}/quiz/1/create`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
           },
            body: JSON.stringify(requestBody),
          });
      
          if (!response.ok) {
            throw new Error("Failed to create quiz");
          }
      
          setReloadquiz(true);
          setopenAdd(false);
        } catch (err) {
          console.error("Error creating quiz:", err.message);
        }
      }      
return (
  <div className="content-section">
    <h2>Quiz Management</h2>

    <div>{!module && quizzes &&
      <div>
        <div className="row mt-5 mx-auto">
          <div className="col-4 me-3">
            {openAdd === false &&
              <a className="btn col-12 btncustom mb-3" onClick={() => setopenAdd(true)}>Add Quiz</a>
            }
            {openAdd === true &&
              <a className="btn col-12 btncustom mb-3" onClick={() => setopenAdd(false)}>  <FontAwesomeIcon icon={faClose}/> Close </a>
            }

            <Collapse in={openAdd}>
              <Card className="mb-3">
                <Card.Body>
                  <AddQuiz QuizEvent={addQuizFn}></AddQuiz>
                </Card.Body>
                <Card.Footer style={{ cursor: "pointer" }} onClick={() => setopenAdd(false)} className="d-flex justify-content-center">
                  <FontAwesomeIcon icon={faArrowUp} />
                </Card.Footer>
              </Card>
            </Collapse>

            <a className="btn col-12 btncustom mb-3" onClick={() => {
              history.push("/module/" + idModule + "/QuizResults");
            }}>
              Show Results
            </a>

            <Collapse in={ShowAddQuestion && Quizselected !== null}>
              <Card className="mb-3">
                <Card.Header>
                  {Quizselected && <Card.Title style={{ textAlign: "center" }}>{Quizselected.title}</Card.Title>}
                </Card.Header>
                <Card.Body>
                  <h6>Questions :</h6>
                  <div id="accordion">
                    {Quizselected && Quizselected.Questions.length > 0 ? (
                      Quizselected.Questions.map((question, index) => (
                        <div className="card my-3" key={index}>
                          <div id={"heading" + index} className="card-header">
                            <h5 className="mb-0">
                              <div className="row">
                                <div className="col-10" data-toggle="collapse" data-target={"#collapse" + index} aria-expanded="true" aria-controls={"collapse" + index} style={{ color: "black", cursor: "pointer" }}>
                                  {question.texte}
                                </div>
                                <div className="col ms-4">
                                  <FontAwesomeIcon size="sm" icon={faTrash} onClick={() => confirDeleteQuestion(Quizselected._id, question._id)} />
                                </div>
                              </div>
                            </h5>
                          </div>
                          <div id={"collapse" + index} className="card-body collapse" aria-labelledby={"heading" + index} data-parent="#accordion">
                            {question.QuestionType === "Radio" &&
                              question.Responses.map((reponse, i) => (
                                <div className="form-group" key={i}>
                                  <input type="radio" name={question.texte} /> {reponse.texte}
                                  <FontAwesomeIcon icon={faXmark} color="red" hidden={!reponse.correct} />
                                  <FontAwesomeIcon icon={faCheck} color="green" hidden={reponse.correct} />
                                </div>
                              ))}
                            {question.QuestionType === "CheckBox" &&
                              question.Responses.map((reponse, i) => (
                                <div className="form-group" key={i}>
                                  <input type="checkbox" name={reponse.texte} /> {reponse.texte} {reponse.correct.toString()}
                                </div>
                              ))}
                            {question.QuestionType === "Select" && (
                              <select className="form-control">
                                {question.Responses.map((reponse, i) => (
                                  <option key={i} value={reponse.texte}>
                                    {reponse.texte} {reponse.correct.toString()}
                                  </option>
                                ))}
                              </select>
                            )}
                          </div>
                        </div>
                      ))
                    ) : (
                      <p className="text-center text-muted">Aucune question trouvée.</p>
                    )}
                  </div>
                </Card.Body>
                <Card.Footer style={{ cursor: "pointer" }} onClick={() => setShowAddQuestion(false)} className="d-flex justify-content-center">
                  <FontAwesomeIcon icon={faArrowUp} />
                </Card.Footer>
                <Modal show={showAddQuestion} onHide={() => setShowAddQuestion(false)}>
            <Modal.Header closeButton>
              <Modal.Title>
                {Quizselected ? `Manage Questions - ${Quizselected.title}` : "No quiz selected"}
              </Modal.Title>
            </Modal.Header>
            <Modal.Body>
              <AddQuestion AddQuestionEvent={AddQuestionEvent} quiz={Quizselected} />
            </Modal.Body>
            <Modal.Footer>
              <Button variant="secondary" onClick={() => setShowAddQuestion(false)}>
                Close <FontAwesomeIcon icon={faArrowUp} />
              </Button>
            </Modal.Footer>
          </Modal>
              </Card>
              
            </Collapse>

          </div>

          <div className="col-7">
            <Table striped bordered hover>
              <thead>
                <tr>
                  <th>#</th>
                  <th>Date</th>
                  <th>Title</th>
                  <th>Link</th>
                  <th>Duration</th>
                  <th style={{ textAlign: "center" }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {quizzes.map((quiz, index) => (
                  <tr key={index} style={{ cursor: "pointer" }} onClick={() => setQuizselected(quiz)}>
                    <td>{index + 1}</td>
                    <td>{quiz.dateQuiz.substring(0, 10)}</td>
                    <td>{quiz.title}</td>
                    <td><a href={`/studentQuiz/${quiz._id}`}>Preview</a></td>
                    <td>
                      {quiz.chrono === false && <FontAwesomeIcon icon={faCircleXmark} color="red" />}
                      {quiz.chrono === true && <FontAwesomeIcon icon={faCircleCheck} className="me-3" color="green" />}
                      {quiz.chrono === true && `${quiz.chronoVal} Minutes`}
                    </td>
                    <td style={{ textAlign: "center" }}>
                      <FontAwesomeIcon icon={faEdit} className="me-3" />
                      <FontAwesomeIcon icon={faTrash} className="me-3" onClick={() => confirmDelete(quiz._id)} />
                      <button
                        className="btn btn-secondary ms-2"
                        onClick={(e) => {
                          e.stopPropagation(); // Empêcher le clic sur la ligne de tableau d'ouvrir le modal
                          setQuizselected(quiz); // Associer le quiz sélectionné au popup
                          setShowAddQuestion(true); // Ouvrir le modal pour ce quiz
                        }}
                      >
                        Manage Questions
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </Table>
          </div>

          {/* Modal pour gérer les questions */}


        </div>
      </div>
    }
    </div>
  </div>
);

    }      
export default QuizAdmin; 