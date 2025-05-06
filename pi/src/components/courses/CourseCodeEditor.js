import React, { useState, useEffect } from 'react';
import { Card, Button, Alert, Accordion, Badge } from 'react-bootstrap';
import LanguageCodeEditor from './CodeEditor';
import axios from 'axios';
import { useParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import './CourseCodeEditor.css';

const CourseCodeEditor = () => {
  const { id: courseId } = useParams();
  const [course, setCourse] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [activeExample, setActiveExample] = useState(null);
  const [userCode, setUserCode] = useState({});
  const [showSolution, setShowSolution] = useState({});

  // Fetch course data
  useEffect(() => {
    const fetchCourse = async () => {
      try {
        setLoading(true);
        const response = await axios.get(`/api/courses/details/${courseId}`);
        setCourse(response.data);
        
        // Initialize user code with the code from examples
        const initialUserCode = {};
        const initialShowSolution = {};
        
        if (response.data.codeExamples && response.data.codeExamples.length > 0) {
          response.data.codeExamples.forEach(example => {
            initialUserCode[example._id] = example.code;
            initialShowSolution[example._id] = false;
          });
          
          // Set the first example as active
          setActiveExample(response.data.codeExamples[0]._id);
        }
        
        setUserCode(initialUserCode);
        setShowSolution(initialShowSolution);
        setLoading(false);
      } catch (err) {
        console.error('Error fetching course:', err);
        setError('Failed to load course data. Please try again later.');
        setLoading(false);
      }
    };

    if (courseId) {
      fetchCourse();
    }
  }, [courseId]);

  // Handle code change
  const handleCodeChange = (exampleId, newCode) => {
    setUserCode(prev => ({
      ...prev,
      [exampleId]: newCode
    }));
  };

  // Toggle solution visibility
  const toggleSolution = (exampleId) => {
    setShowSolution(prev => ({
      ...prev,
      [exampleId]: !prev[exampleId]
    }));
  };

  // Reset code to original
  const resetCode = (exampleId, originalCode) => {
    setUserCode(prev => ({
      ...prev,
      [exampleId]: originalCode
    }));
    toast.info('Code reset to original example');
  };

  // Validate exercise
  const validateExercise = (exampleId, code, solution) => {
    // This is a simple validation that checks if the user's code includes key parts of the solution
    // In a real application, you would want a more sophisticated validation mechanism
    try {
      // Remove whitespace and make lowercase for comparison
      const normalizedCode = code.replace(/\s+/g, '').toLowerCase();
      const normalizedSolution = solution.replace(/\s+/g, '').toLowerCase();
      
      // Check if the code contains the essential parts of the solution
      // This is a very basic check and should be improved for production
      if (normalizedCode.includes(normalizedSolution)) {
        toast.success('Great job! Your solution is correct.');
        return { success: true, message: 'Your solution is correct!' };
      } else {
        toast.warning('Your solution is not quite right. Try again or check the hints.');
        return { success: false, message: 'Your solution is not quite right. Try again or check the hints.' };
      }
    } catch (error) {
      console.error('Error validating exercise:', error);
      return { success: false, message: 'Error validating your code. Please try again.' };
    }
  };

  if (loading) {
    return <div className="text-center my-5">Loading course content...</div>;
  }

  if (error) {
    return <Alert variant="danger">{error}</Alert>;
  }

  if (!course) {
    return <Alert variant="warning">Course not found</Alert>;
  }

  // Check if course has code examples
  if (!course.codeExamples || course.codeExamples.length === 0) {
    return (
      <Alert variant="info">
        This course doesn't have any code examples yet.
      </Alert>
    );
  }

  return (
    <div className="course-code-editor">
      <h2 className="mb-4">Code Examples & Exercises</h2>
      
      <div className="row">
        {/* Sidebar with examples list */}
        <div className="col-md-3">
          <Card className="examples-sidebar">
            <Card.Header>
              <strong>Examples & Exercises</strong>
            </Card.Header>
            <Card.Body className="p-0">
              <div className="list-group list-group-flush">
                {course.codeExamples.map(example => (
                  <button
                    key={example._id}
                    className={`list-group-item list-group-item-action ${activeExample === example._id ? 'active' : ''}`}
                    onClick={() => setActiveExample(example._id)}
                  >
                    {example.title}
                    {example.isExercise && (
                      <Badge bg="primary" className="ms-2">Exercise</Badge>
                    )}
                  </button>
                ))}
              </div>
            </Card.Body>
          </Card>
        </div>
        
        {/* Main content area */}
        <div className="col-md-9">
          {course.codeExamples.map(example => (
            <div 
              key={example._id} 
              className={`code-example-container ${activeExample === example._id ? 'd-block' : 'd-none'}`}
            >
              <Card className="mb-4">
                <Card.Header>
                  <div className="d-flex justify-content-between align-items-center">
                    <h4 className="mb-0">{example.title}</h4>
                    {example.isExercise && (
                      <Badge bg="primary">Exercise</Badge>
                    )}
                  </div>
                </Card.Header>
                <Card.Body>
                  <p>{example.description}</p>
                  
                  {/* Code Editor */}
                  <LanguageCodeEditor
                    language={example.language}
                    initialCode={example.code}
                    height="300px"
                    readOnly={false}
                    runnable={true}
                    onCodeChange={(newCode) => handleCodeChange(example._id, newCode)}
                    exerciseValidation={example.isExercise && example.solution 
                      ? (code) => validateExercise(example._id, code, example.solution)
                      : null
                    }
                  />
                  
                  {/* Action buttons */}
                  <div className="mt-3 d-flex justify-content-between">
                    <Button 
                      variant="secondary" 
                      onClick={() => resetCode(example._id, example.code)}
                    >
                      Reset Code
                    </Button>
                    
                    {example.isExercise && example.solution && (
                      <Button 
                        variant={showSolution[example._id] ? "warning" : "info"} 
                        onClick={() => toggleSolution(example._id)}
                      >
                        {showSolution[example._id] ? "Hide Solution" : "Show Solution"}
                      </Button>
                    )}
                  </div>
                  
                  {/* Solution (if it's an exercise) */}
                  {example.isExercise && example.solution && showSolution[example._id] && (
                    <div className="mt-3">
                      <Alert variant="info">
                        <h5>Solution:</h5>
                        <LanguageCodeEditor
                          language={example.language}
                          initialCode={example.solution}
                          height="200px"
                          readOnly={true}
                          runnable={false}
                        />
                      </Alert>
                    </div>
                  )}
                  
                  {/* Hints (if it's an exercise) */}
                  {example.isExercise && example.hints && example.hints.length > 0 && (
                    <Accordion className="mt-3">
                      <Accordion.Item eventKey="0">
                        <Accordion.Header>Hints</Accordion.Header>
                        <Accordion.Body>
                          <ul className="list-group">
                            {example.hints.map((hint, index) => (
                              <li key={index} className="list-group-item">
                                {hint}
                              </li>
                            ))}
                          </ul>
                        </Accordion.Body>
                      </Accordion.Item>
                    </Accordion>
                  )}
                </Card.Body>
              </Card>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

export default CourseCodeEditor;
