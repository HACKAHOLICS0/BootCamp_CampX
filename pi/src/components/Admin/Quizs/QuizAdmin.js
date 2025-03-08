import { Route, useNavigate, useParams } from "react-router-dom";
import React, { useState, useEffect } from 'react';
import { Badge, Card, Collapse, Table, Modal, Button } from "react-bootstrap";
import AddQuiz from "./AddQuiz";
import { FontAwesomeIcon } from "@fortawesome/react-fontawesome";
import { faChevronDown, faChevronUp } from "@fortawesome/free-solid-svg-icons";
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import AddQuestion from "./AddQuestion";
import { Switch } from "@mui/material";
import Cookies from 'js-cookie';
import config from '../../../config';

const QuizAdmin = () => {
    const { idModule } = useParams();
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [openAdd, setopenAdd] = useState(false);
    const [showAddQuestion, setShowAddQuestion] = useState(false);
    const [Quizselected, setQuizselected] = useState(null);
    const [editQuiz, setEditQuiz] = useState(false);
    const [keySelected, setKeySelected] = useState(-1);
    const [checked, setChecked] = useState(false);
    const [erroChronoval, setSeTerroChronoval] = useState(false);
    const [selectedQuizId, setSelectedQuizId] = useState(null);
    const [isOpen, setIsOpen] = useState(false);
    const [courses, setCourses] = useState([]);
    const [selectedCourse, setSelectedCourse] = useState('');
    const [selectedCourseTemp, setSelectedCourseTemp] = useState('');
    const [reloadquiz, setreloadquiz] = useState(false);

    useEffect(() => {
        fetchQuizzes();
        fetchCourses();
    }, [reloadquiz]);

    const fetchQuizzes = async () => {
        try {
            setLoading(true);
            setError(null);
            const token = Cookies.get('token');
            const response = await fetch(`${config.API_URL}/api/quiz`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch quizzes');
            }
            
            const data = await response.json();
            setQuizzes(data);
            setLoading(false);
        } catch (err) {
            console.error('Error fetching quizzes:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    const fetchCourses = async () => {
        try {
            const token = Cookies.get('token');
            const response = await fetch(`${config.API_URL}/api/courses`, {
                headers: {
                    'Authorization': `Bearer ${token}`,
                    'Content-Type': 'application/json'
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to fetch courses');
            }
            
            const data = await response.json();
            setCourses(data);
        } catch (err) {
            console.error('Error fetching courses:', err);
            setError(err.message);
        }
    };

    const handleKeyPresstitle = async (event) => {
        if (event.key === 'Enter' && Quizselected?._id) {
            try {
                const token = Cookies.get('token');
                const response = await fetch(`${config.API_URL}/api/quiz/${Quizselected._id}`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title: event.target.value,
                        chrono: Quizselected.chrono,
                        chronoVal: Quizselected.chronoVal
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to update quiz title');
                }
                
                await fetchQuizzes();
                setEditQuiz(false);
            } catch (err) {
                console.error('Error updating quiz title:', err);
                setError(err.message);
            }
        }
    };

    const handleKeyPresschrono = async (event) => {
        if (event.key === 'Enter') {
            const value = parseInt(event.target.value);
            if (value > 0 && Quizselected?._id) {
                try {
                    const token = Cookies.get('token');
                    const response = await fetch(`${config.API_URL}/api/quiz/${Quizselected._id}`, {
                        method: 'PUT',
                        headers: { 
                            'Content-Type': 'application/json',
                            'Accept': 'application/json',
                            'Authorization': `Bearer ${token}`
                        },
                        body: JSON.stringify({
                            title: Quizselected.title,
                            chrono: checked,
                            chronoVal: value
                        })
                    });

                    if (!response.ok) {
                        throw new Error('Failed to update quiz timer');
                    }
                    
                    await fetchQuizzes();
                    setSeTerroChronoval(false);
                } catch (err) {
                    console.error('Error updating quiz timer:', err);
                    setError(err.message);
                }
            } else {
                setSeTerroChronoval(true);
            }
        }
    };

    const handleChange = async (event) => {
        setChecked(event.target.checked);
        if (!event.target.checked && Quizselected?._id) {
            try {
                const token = Cookies.get('token');
                const response = await fetch(`${config.API_URL}/api/quiz/${Quizselected._id}`, {
                    method: 'PUT',
                    headers: { 
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title: Quizselected.title,
                        chrono: false,
                        chronoVal: 0
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to update quiz timer');
                }
                
                const updatedQuizzes = quizzes.map(q =>
                    q._id === Quizselected._id ? { ...q, chrono: false, chronoVal: 0 } : q
                );
                setQuizzes(updatedQuizzes);
            } catch (err) {
                console.error('Error updating quiz timer:', err);
                setError(err.message);
            }
        }
    };

    const handleDeleteQuiz = async (id) => {
        try {
            const token = Cookies.get('token');
            const response = await fetch(`${config.API_URL}/api/quiz/${id}`, {
                method: 'DELETE',
                headers: { 
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to delete quiz');
            }
            
            setSuccess('Quiz deleted successfully');
            await fetchQuizzes();
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Error deleting quiz:', err);
            setError(err.message);
            setTimeout(() => setError(null), 3000);
        }
    };

    const addQuestionEvent = async (data, responses, code, language) => {
        if (!Quizselected?._id) {
            setError('No quiz selected');
            return;
        }

        try {
            const token = Cookies.get('token');
            const requestBody = {
                question: data.texte,
                options: responses.map(r => ({
                    text: r.texte,
                    isCorrect: r.correct
                })),
                points: 1
            };

            if (code && language) {
                requestBody.code = code;
                requestBody.language = language;
            }

            const response = await fetch(`${config.API_URL}/api/quiz/${Quizselected._id}/question`, {
                method: 'POST',
                headers: { 
                    'Content-Type': 'application/json',
                    'Accept': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify(requestBody)
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.error || 'Failed to add question');
            }

            const updatedQuiz = await response.json();
            setQuizselected(updatedQuiz);
            await fetchQuizzes();
            setShowAddQuestion(false);
            setSuccess('Question added successfully');
            setTimeout(() => setSuccess(null), 3000);
        } catch (err) {
            console.error('Error adding question:', err);
            setError(err.message);
            setTimeout(() => setError(null), 3000);
        }
    };

    const confirmDelete = (id) => {
        confirmAlert({
            title: 'Confirm Delete',
            message: 'Are you sure you want to delete this quiz?',
            buttons: [
                {
                    label: 'Yes',
                    onClick: () => handleDeleteQuiz(id)
                },
                {
                    label: 'No'
                }
            ]
        });
    };

    return (
        <div className="content-section">
            <h2>Quiz Management</h2>
            {error && (
                <div className="alert alert-danger" role="alert">
                    {error}
                </div>
            )}
            {success && (
                <div className="alert alert-success" role="alert">
                    {success}
                </div>
            )}
            {loading ? (
                <div className="text-center">
                    <p>Loading...</p>
                </div>
            ) : (
                <div className="row mt-5 mx-auto">
                    <div className="col-4 me-3">
                        {openAdd ? (
                            <a className="btn col-12 btncustom mb-3" onClick={() => setopenAdd(false)}>
                                <FontAwesomeIcon icon={faChevronUp} /> Close
                            </a>
                        ) : (
                            <a className="btn col-12 btncustom mb-3" onClick={() => setopenAdd(true)}>
                                <FontAwesomeIcon icon={faChevronDown} /> Add Quiz
                            </a>
                        )}

                        <Collapse in={openAdd}>
                            <Card className="mb-3">
                                <Card.Body>
                                    <AddQuiz 
                                        onClose={() => setopenAdd(false)}
                                        onSuccess={() => {
                                            setSuccess('Quiz added successfully');
                                            setopenAdd(false);
                                            setreloadquiz(!reloadquiz);
                                            setTimeout(() => setSuccess(null), 3000);
                                        }}
                                    />
                                </Card.Body>
                            </Card>
                        </Collapse>

                        <Collapse in={showAddQuestion && Quizselected}>
                            <Card className="mb-3">
                                <Card.Header>
                                    <Card.Title style={{ textAlign: "center" }}>
                                        {Quizselected?.title || 'No Quiz Selected'}
                                    </Card.Title>
                                </Card.Header>
                                <Card.Body>
                                    <AddQuestion onAddQuestion={addQuestionEvent} quiz={Quizselected} />
                                </Card.Body>
                            </Card>
                        </Collapse>
                    </div>

                    <div className="col-7">
                        <Table striped bordered hover>
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Title</th>
                                    <th>Timer</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {quizzes.map((quiz, index) => (
                                    <tr key={quiz._id}>
                                        <td>{index + 1}</td>
                                        <td>
                                            {editQuiz && keySelected === index ? (
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    defaultValue={quiz.title}
                                                    onKeyPress={handleKeyPresstitle}
                                                />
                                            ) : (
                                                quiz.title
                                            )}
                                        </td>
                                        <td>
                                            <div className="d-flex align-items-center">
                                                <Switch
                                                    checked={quiz.chrono}
                                                    onChange={(e) => {
                                                        setQuizselected(quiz);
                                                        handleChange(e);
                                                    }}
                                                />
                                                {quiz.chrono && (
                                                    <div className="ms-3">
                                                        {editQuiz && keySelected === index ? (
                                                            <input
                                                                type="number"
                                                                className="form-control"
                                                                defaultValue={quiz.chronoVal}
                                                                onKeyPress={handleKeyPresschrono}
                                                                min="1"
                                                            />
                                                        ) : (
                                                            <span>{quiz.chronoVal} minutes</span>
                                                        )}
                                                    </div>
                                                )}
                                            </div>
                                            {erroChronoval && checked && keySelected === index && (
                                                <div className="alert alert-danger mt-2">
                                                    Timer must be greater than 0
                                                </div>
                                            )}
                                        </td>
                                        <td>
                                            <div className="btn-group">
                                                {editQuiz && keySelected === index ? (
                                                    <button
                                                        className="btn btn-secondary"
                                                        onClick={() => {
                                                            setEditQuiz(false);
                                                            setKeySelected(-1);
                                                        }}
                                                    >
                                                        Cancel
                                                    </button>
                                                ) : (
                                                    <button
                                                        className="btn btn-primary"
                                                        onClick={() => {
                                                            setQuizselected(quiz);
                                                            setKeySelected(index);
                                                            setEditQuiz(true);
                                                            setChecked(quiz.chrono);
                                                        }}
                                                    >
                                                        Edit
                                                    </button>
                                                )}
                                                <button
                                                    className="btn btn-info"
                                                    onClick={() => {
                                                        setQuizselected(quiz);
                                                        setShowAddQuestion(true);
                                                    }}
                                                >
                                                    Questions
                                                </button>
                                                <button
                                                    className="btn btn-danger"
                                                    onClick={() => confirmDelete(quiz._id)}
                                                >
                                                    Delete
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </Table>
                    </div>
                </div>
            )}

            <Modal show={showAddQuestion} onHide={() => setShowAddQuestion(false)}>
                <Modal.Header closeButton>
                    <Modal.Title>Add Question to {Quizselected?.title}</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    <AddQuestion onAddQuestion={addQuestionEvent} quiz={Quizselected} />
                </Modal.Body>
            </Modal>
        </div>
    );
};

export default QuizAdmin;