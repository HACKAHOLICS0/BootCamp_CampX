import React, { useState, useEffect } from 'react';
import { Badge, Modal, Button, Card } from "react-bootstrap";
import AddQuiz from "./AddQuiz";
import { confirmAlert } from 'react-confirm-alert';
import 'react-confirm-alert/src/react-confirm-alert.css';
import AddQuestion from "./AddQuestion";
import { Switch } from "@mui/material";
import Cookies from 'js-cookie';
import config from '../../../config';
import '../styles/AdminTableStyle.css';
import '../styles/AdminPointsStyle.css';
import Pagination from '../common/Pagination';

const QuizAdmin = () => {
    const [quizzes, setQuizzes] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [success, setSuccess] = useState(null);
    const [showAddQuestion, setShowAddQuestion] = useState(false);
    const [Quizselected, setQuizselected] = useState(null);
    const [editQuiz, setEditQuiz] = useState(false);
    const [keySelected, setKeySelected] = useState(-1);
    const [checked, setChecked] = useState(false);
    const [erroChronoval, setSeTerroChronoval] = useState(false);
    const [reloadquiz, setreloadquiz] = useState(false);
    const [showDetails, setShowDetails] = useState(false);
    const [selectedQuizDetails, setSelectedQuizDetails] = useState(null);

    // Modal states
    const [isModalOpen, setIsModalOpen] = useState(false);

    // Pagination states
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(5);

    // Filter state
    const [quizTypeFilter, setQuizTypeFilter] = useState('all'); // 'all', 'standard', 'final'

    useEffect(() => {
        fetchQuizzes();
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
            setCurrentPage(1); // Reset to first page when quizzes are reloaded
            setLoading(false);
        } catch (err) {
            console.error('Error fetching quizzes:', err);
            setError(err.message);
            setLoading(false);
        }
    };

    // Removed unused fetchCourses function

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
                            chrono: true,
                            chronoVal: value
                        })
                    });

                    if (!response.ok) {
                        throw new Error('Failed to update quiz timer');
                    }

                    const updatedQuizzes = quizzes.map(q =>
                        q._id === Quizselected._id ? { ...q, chrono: true, chronoVal: value } : q
                    );
                    setQuizzes(updatedQuizzes);
                    setChecked(true);
                    setSeTerroChronoval(false);
                    setEditQuiz(false);
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
        const isChecked = event.target.checked;
        setChecked(isChecked);

        if (Quizselected?._id) {
            try {
                const token = Cookies.get('token');
                const timerValue = isChecked ? (Quizselected.chronoVal || 30) : 0;

                const response = await fetch(`${config.API_URL}/api/quiz/${Quizselected._id}`, {
                    method: 'PUT',
                    headers: {
                        'Content-Type': 'application/json',
                        'Accept': 'application/json',
                        'Authorization': `Bearer ${token}`
                    },
                    body: JSON.stringify({
                        title: Quizselected.title,
                        chrono: isChecked,
                        chronoVal: timerValue
                    })
                });

                if (!response.ok) {
                    throw new Error('Failed to update quiz timer');
                }

                const updatedQuizzes = quizzes.map(q =>
                    q._id === Quizselected._id ? { ...q, chrono: isChecked, chronoVal: timerValue } : q
                );
                setQuizzes(updatedQuizzes);
            } catch (err) {
                console.error('Error updating quiz timer:', err);
                setError(err.message);
                // Revert the switch state if there's an error
                setChecked(!isChecked);
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

    const handleShowDetails = (quiz) => {
        setSelectedQuizDetails(quiz);
        setShowDetails(true);
    };

    // Utility function to filter quizzes by type
    const filterQuizzesByType = (quizList) => {
        return quizList.filter(quiz => {
            if (quizTypeFilter === 'all') return true;
            if (quizTypeFilter === 'standard') return !quiz.isFinalQuiz;
            if (quizTypeFilter === 'final') return quiz.isFinalQuiz;
            return true;
        });
    };

    // Handle opening the add quiz modal
    const handleAdd = () => {
        setIsModalOpen(true);
    };

    // Handle closing the add quiz modal
    const handleModalClose = () => {
        setIsModalOpen(false);
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
                    <div className="col-12">
                        <button className="action-btn add" onClick={handleAdd}>Add Quiz</button>

                        {/* Modal for adding questions is now using Bootstrap Modal component */}
                        <div className="table-controls" style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '10px' }}>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <label htmlFor="quizTypeFilter" style={{ marginRight: '10px', fontSize: '14px' }}>
                                    Type de quiz:
                                </label>
                                <select
                                    id="quizTypeFilter"
                                    value={quizTypeFilter}
                                    onChange={(e) => {
                                        setQuizTypeFilter(e.target.value);
                                        setCurrentPage(1); // Reset to first page when changing filter
                                    }}
                                    style={{
                                        padding: '5px 10px',
                                        borderRadius: '4px',
                                        border: '1px solid #e2e8f0',
                                        backgroundColor: '#fff',
                                        fontSize: '14px'
                                    }}
                                >
                                    <option value="all">Tous les quiz</option>
                                    <option value="standard">Quiz Standard</option>
                                    <option value="final">Quiz Final</option>
                                </select>
                            </div>
                            <div style={{ display: 'flex', alignItems: 'center' }}>
                                <label htmlFor="itemsPerPage" style={{ marginRight: '10px', fontSize: '14px' }}>
                                    Items per page:
                                </label>
                                <select
                                    id="itemsPerPage"
                                    value={itemsPerPage}
                                    onChange={(e) => {
                                        setItemsPerPage(Number(e.target.value));
                                        setCurrentPage(1); // Reset to first page when changing items per page
                                    }}
                                    style={{
                                        padding: '5px 10px',
                                        borderRadius: '4px',
                                        border: '1px solid #e2e8f0',
                                        backgroundColor: '#fff',
                                        fontSize: '14px'
                                    }}
                                >
                                    <option value={5}>5</option>
                                    <option value={10}>10</option>
                                    <option value={15}>15</option>
                                    <option value={20}>20</option>
                                </select>
                            </div>
                        </div>
                        <table className="data-table">
                            <thead>
                                <tr>
                                    <th>#</th>
                                    <th>Title</th>
                                    <th>Timer</th>
                                    <th>Type</th>
                                    <th>Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {quizzes.length > 0 ? (
                                    // Filter quizzes by type and then paginate
                                    filterQuizzesByType(quizzes)
                                        .slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage)
                                        .map((quiz, index) => (
                                    <tr key={quiz._id}>
                                        <td>{(currentPage - 1) * itemsPerPage + index + 1}</td>
                                        <td>
                                            {editQuiz && keySelected === index ? (
                                                <input
                                                    type="text"
                                                    className="form-control"
                                                    defaultValue={quiz.title}
                                                    onKeyDown={(e) => e.key === 'Enter' && handleKeyPresstitle(e)}
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
                                                                onKeyDown={(e) => e.key === 'Enter' && handleKeyPresschrono(e)}
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
                                            {quiz.isFinalQuiz ? (
                                                <Badge bg="success">Quiz Final</Badge>
                                            ) : (
                                                <Badge bg="primary">Quiz Standard</Badge>
                                            )}
                                        </td>
                                        <td className="action-buttons">
                                            {editQuiz && keySelected === index ? (
                                                <button
                                                    className="action-btn cancel"
                                                    onClick={() => {
                                                        setEditQuiz(false);
                                                        setKeySelected(-1);
                                                    }}
                                                >
                                                    Cancel
                                                </button>
                                            ) : (
                                                <button
                                                    className="action-btn modify"
                                                    onClick={() => {
                                                        setQuizselected(quiz);
                                                        setKeySelected(index);
                                                        setEditQuiz(true);
                                                        setChecked(Boolean(quiz.chrono));
                                                    }}
                                                >
                                                    Edit
                                                </button>
                                            )}
                                            <button
                                                className="action-btn questions"
                                                onClick={() => {
                                                    setQuizselected(quiz);
                                                    setShowAddQuestion(true);
                                                }}
                                            >
                                                Questions
                                            </button>
                                            <button
                                                className="action-btn details"
                                                onClick={() => handleShowDetails(quiz)}
                                            >
                                                Details
                                            </button>
                                            <button
                                                className="action-btn delete"
                                                onClick={() => confirmDelete(quiz._id)}
                                            >
                                                Delete
                                            </button>
                                        </td>
                                    </tr>
                                ))
                                ) : (
                                    <tr className="no-data">
                                        <td colSpan="5">No quizzes found</td>
                                    </tr>
                                )}
                            </tbody>
                        </table>

                        {/* Pagination */}
                        {quizzes.length > 0 && (
                            <Pagination
                                currentPage={currentPage}
                                totalPages={Math.ceil(
                                    filterQuizzesByType(quizzes).length / itemsPerPage
                                )}
                                onPageChange={setCurrentPage}
                                totalItems={filterQuizzesByType(quizzes).length}
                                itemsPerPage={itemsPerPage}
                            />
                        )}
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

            <Modal show={showDetails} onHide={() => setShowDetails(false)} size="lg">
                <Modal.Header closeButton>
                    <Modal.Title>{selectedQuizDetails?.title} - Details</Modal.Title>
                </Modal.Header>
                <Modal.Body>
                    {selectedQuizDetails && (
                        <div>
                            <div className="mb-3">
                                <strong>Timer:</strong>{' '}
                                {selectedQuizDetails.chrono && selectedQuizDetails.chronoVal > 0
                                    ? `${selectedQuizDetails.chronoVal} minutes`
                                    : 'No timer'}
                            </div>
                            <div className="mb-3">
                                <strong>Type:</strong>{' '}
                                {selectedQuizDetails.isFinalQuiz
                                    ? <Badge bg="success">Quiz Final</Badge>
                                    : <Badge bg="primary">Quiz Standard</Badge>}
                            </div>
                            <div className="mb-3">
                                <strong>Total Questions:</strong> {selectedQuizDetails.Questions?.length || 0}
                            </div>
                            <div>
                                <strong>Questions:</strong>
                                {selectedQuizDetails.Questions?.length > 0 ? (
                                    <div className="mt-3">
                                        {selectedQuizDetails.Questions.map((question, index) => (
                                            <Card key={question._id} className="mb-3">
                                                <Card.Header>
                                                    <strong>Question {index + 1}</strong>
                                                    {question.points > 1 && (
                                                        <Badge bg="info" className="ms-2">
                                                            {question.points} points
                                                        </Badge>
                                                    )}
                                                </Card.Header>
                                                <Card.Body>
                                                    <p>{question.texte}</p>
                                                    <div className="ms-3">
                                                        <strong>Responses:</strong>
                                                        <ul className="list-unstyled mt-2">
                                                            {question.Responses.map((response, rIndex) => (
                                                                <li key={rIndex} className={`mb-1 ${response.isCorrect ? 'text-success' : ''}`}>
                                                                    {response.isCorrect && '✓ '}{response.texte}
                                                                </li>
                                                            ))}
                                                        </ul>
                                                    </div>
                                                </Card.Body>
                                            </Card>
                                        ))}
                                    </div>
                                ) : (
                                    <p className="text-muted mt-2">No questions added yet</p>
                                )}
                            </div>
                        </div>
                    )}
                </Modal.Body>
                <Modal.Footer>
                    <Button variant="secondary" onClick={() => setShowDetails(false)}>
                        Close
                    </Button>
                </Modal.Footer>
            </Modal>

            {/* Modal for adding quiz */}
            {isModalOpen && (
                <div className="modal-overlay">
                    <div className="modal-content">
                        <h3>Add New Quiz</h3>
                        <AddQuiz
                            onClose={handleModalClose}
                            onSuccess={() => {
                                setSuccess('Quiz added successfully');
                                handleModalClose();
                                setreloadquiz(!reloadquiz);
                                setTimeout(() => setSuccess(null), 3000);
                            }}
                        />
                    </div>
                </div>
            )}
        </div>
    );
};

export default QuizAdmin;