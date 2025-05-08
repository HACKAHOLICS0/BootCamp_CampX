import React, { useState, useEffect } from 'react';
import { useForm } from "react-hook-form";
import { yupResolver } from '@hookform/resolvers/yup';
import * as yup from "yup";
import { Switch } from '@mui/material';
import { Form, Button, Alert } from 'react-bootstrap';
import config from '../../../config';
import Cookies from 'js-cookie';

const schema = yup.object().shape({
    title: yup.string().required('Quiz title is required'),
    courseId: yup.string().required('Course selection is required'),
    chrono: yup.boolean(),
    isFinalQuiz: yup.boolean(), // Ajout du champ pour quiz final
    chronoVal: yup.number()
        .transform((value) => (isNaN(value) ? undefined : value))
        .when('chrono', {
            is: true,
            then: () => yup.number()
                .min(1, 'Timer must be greater than 0')
                .required('Timer value is required'),
            otherwise: () => yup.number().notRequired()
        })
});

const AddQuiz = ({ onClose = () => {}, onSuccess = () => {} }) => {
    const [error, setError] = useState(null);
    const [courses, setCourses] = useState([]);
    const [loading, setLoading] = useState(true);

    const { register, handleSubmit, formState: { errors }, watch, setValue } = useForm({
        resolver: yupResolver(schema),
        defaultValues: {
            title: '',
            chronoVal: 30,
            chrono: false,
            isFinalQuiz: false, // Valeur par défaut pour quiz final
            courseId: ''
        }
    });

    const chrono = watch('chrono');
    const isFinalQuiz = watch('isFinalQuiz');

    useEffect(() => {
        fetchCourses();
    }, []);

    const fetchCourses = async () => {
        try {
            const token = Cookies.get('token');
            const response = await fetch(`${config.API_URL}${config.endpoints.courses}`, {
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
            setError(err.message);
        } finally {
            setLoading(false);
        }
    };

    const handleTimerChange = (event) => {
        setValue('chrono', event.target.checked);
        if (!event.target.checked) {
            setValue('chronoVal', 0);
        }
    };

    const handleFinalQuizChange = (event) => {
        setValue('isFinalQuiz', event.target.checked);
    };

    const onSubmit = async (data) => {
        try {
            const token = Cookies.get('token');
            const response = await fetch(`${config.API_URL}/api/quiz`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${token}`
                },
                body: JSON.stringify({
                    title: data.title,
                    chrono: data.chrono,
                    chronoVal: data.chrono ? Math.max(1, parseInt(data.chronoVal) || 30) : 0,
                    course: data.courseId,
                    isFinalQuiz: data.isFinalQuiz
                })
            });

            if (!response.ok) {
                const errorData = await response.json();
                throw new Error(errorData.message || 'Failed to create quiz');
            }

            const result = await response.json();
            onSuccess(result);
        } catch (err) {
            setError(err.message);
            setTimeout(() => setError(null), 3000);
        }
    };

    if (loading) {
        return <div>Loading courses...</div>;
    }

    return (
        <Form onSubmit={handleSubmit(onSubmit)}>
            {error && (
                <Alert variant="danger" onClose={() => setError(null)} dismissible>
                    {error}
                </Alert>
            )}

            <Form.Group className="mb-3">
                <Form.Label>Quiz Title</Form.Label>
                <Form.Control
                    type="text"
                    placeholder="Enter quiz title"
                    isInvalid={!!errors.title}
                    {...register("title")}
                />
                <Form.Control.Feedback type="invalid">
                    {errors.title?.message}
                </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label>Select Course</Form.Label>
                <Form.Select
                    isInvalid={!!errors.courseId}
                    {...register("courseId")}
                >
                    <option value="">Select a course</option>
                    {courses.map(course => (
                        <option key={course._id} value={course._id}>
                            {course.title}
                        </option>
                    ))}
                </Form.Select>
                <Form.Control.Feedback type="invalid">
                    {errors.courseId?.message}
                </Form.Control.Feedback>
            </Form.Group>

            <Form.Group className="mb-3">
                <Form.Label className="d-flex align-items-center">
                    <Switch
                        checked={chrono}
                        onChange={handleTimerChange}
                        color="primary"
                        size="small"
                        className="me-2"
                    />
                    Timer (Minutes)
                </Form.Label>

                {chrono && (
                    <Form.Control
                        type="number"
                        min="1"
                        placeholder="Enter time in minutes"
                        isInvalid={!!errors.chronoVal}
                        {...register("chronoVal")}
                    />
                )}
                <Form.Control.Feedback type="invalid">
                    {errors.chronoVal?.message}
                </Form.Control.Feedback>
            </Form.Group>

            {/* Ajout de l'option Quiz Final */}
            <Form.Group className="mb-3">
                <Form.Label className="d-flex align-items-center">
                    <Switch
                        checked={isFinalQuiz}
                        onChange={handleFinalQuizChange}
                        color="primary"
                        size="small"
                        className="me-2"
                    />
                    Quiz Final
                </Form.Label>
                <Form.Text className="text-muted">
                    Désigner ce quiz comme le quiz final du cours. Ce quiz sera accessible uniquement après que tous les autres quiz du cours aient été complétés.
                </Form.Text>
            </Form.Group>

            <div className="d-flex justify-content-end gap-2">
                <button className="action-btn cancel" onClick={onClose}>
                    Cancel
                </button>
                <button className="action-btn add" type="submit">
                    Create Quiz
                </button>
            </div>
        </Form>
    );
};

export default AddQuiz;