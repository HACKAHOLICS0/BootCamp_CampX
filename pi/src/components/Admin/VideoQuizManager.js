import React, { useState } from 'react';
import {
  Box,
  Button,
  TextField,
  IconButton,
  Typography,
  Paper,
  Grid,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Snackbar,
  Alert
} from '@mui/material';
import { Add, Delete, Edit } from '@mui/icons-material';

const VideoQuizManager = ({ quiz, onChange }) => {
  const [openDialog, setOpenDialog] = useState(false);
  const [selectedQuestion, setSelectedQuestion] = useState(null);
  const [formData, setFormData] = useState({
    timestamp: '',
    question: '',
    options: ['', '', '', ''],
    answer: '',
    explanation: '',
    points: 1
  });
  const [snackbar, setSnackbar] = useState({ open: false, message: '', severity: 'success' });

  const handleOpenDialog = (question = null) => {
    if (question) {
      setSelectedQuestion(question);
      setFormData({
        timestamp: question.timestamp,
        question: question.question,
        options: [...question.options],
        answer: question.answer,
        explanation: question.explanation || '',
        points: question.points || 1
      });
    } else {
      setSelectedQuestion(null);
      setFormData({
        timestamp: '',
        question: '',
        options: ['', '', '', ''],
        answer: '',
        explanation: '',
        points: 1
      });
    }
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setSelectedQuestion(null);
    setFormData({
      timestamp: '',
      question: '',
      options: ['', '', '', ''],
      answer: '',
      explanation: '',
      points: 1
    });
  };

  const handleOptionChange = (index, value) => {
    const newOptions = [...formData.options];
    newOptions[index] = value;
    setFormData({ ...formData, options: newOptions });
  };

  const handleSubmit = () => {
    const newQuiz = [...quiz];
    if (selectedQuestion) {
      const index = newQuiz.findIndex(q => q.timestamp === selectedQuestion.timestamp);
      if (index !== -1) {
        newQuiz[index] = formData;
      }
    } else {
      newQuiz.push(formData);
    }
    onChange(newQuiz);
    handleCloseDialog();
    setSnackbar({
      open: true,
      message: `Question ${selectedQuestion ? 'updated' : 'added'} successfully`,
      severity: 'success'
    });
  };

  const handleDelete = (timestamp) => {
    const newQuiz = quiz.filter(q => q.timestamp !== timestamp);
    onChange(newQuiz);
    setSnackbar({
      open: true,
      message: 'Question deleted successfully',
      severity: 'success'
    });
  };

  const formatTime = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  return (
    <Box sx={{ mt: 3 }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
        <Typography variant="h6">Interactive Questions</Typography>
        <Button
          variant="contained"
          color="primary"
          startIcon={<Add />}
          onClick={() => handleOpenDialog()}
        >
          Add Question
        </Button>
      </Box>

      <Grid container spacing={2}>
        {quiz.map((question, index) => (
          <Grid item xs={12} key={index}>
            <Paper sx={{ p: 2 }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', mb: 2 }}>
                <Typography variant="subtitle1">
                  Time: {formatTime(question.timestamp)}
                </Typography>
                <Box>
                  <IconButton onClick={() => handleOpenDialog(question)}>
                    <Edit />
                  </IconButton>
                  <IconButton onClick={() => handleDelete(question.timestamp)}>
                    <Delete />
                  </IconButton>
                </Box>
              </Box>
              <Typography variant="body1" sx={{ mb: 1 }}>
                {question.question}
              </Typography>
              <Box sx={{ ml: 2 }}>
                {question.options.map((option, optIndex) => (
                  <Typography
                    key={optIndex}
                    variant="body2"
                    color={option === question.answer ? 'primary' : 'text.secondary'}
                    sx={{ mb: 0.5 }}
                  >
                    {optIndex + 1}. {option}
                  </Typography>
                ))}
              </Box>
              {question.explanation && (
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Explanation: {question.explanation}
                </Typography>
              )}
              <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                Points: {question.points}
              </Typography>
            </Paper>
          </Grid>
        ))}
      </Grid>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>
          {selectedQuestion ? 'Edit Question' : 'Add New Question'}
        </DialogTitle>
        <DialogContent>
          <Grid container spacing={2} sx={{ mt: 1 }}>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Timestamp (seconds)"
                type="number"
                value={formData.timestamp}
                onChange={(e) => setFormData({ ...formData, timestamp: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Question"
                multiline
                rows={2}
                value={formData.question}
                onChange={(e) => setFormData({ ...formData, question: e.target.value })}
                required
              />
            </Grid>
            {formData.options.map((option, index) => (
              <Grid item xs={12} key={index}>
                <TextField
                  fullWidth
                  label={`Option ${index + 1}`}
                  value={option}
                  onChange={(e) => handleOptionChange(index, e.target.value)}
                  required
                />
              </Grid>
            ))}
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Correct Answer"
                value={formData.answer}
                onChange={(e) => setFormData({ ...formData, answer: e.target.value })}
                required
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Explanation"
                multiline
                rows={2}
                value={formData.explanation}
                onChange={(e) => setFormData({ ...formData, explanation: e.target.value })}
              />
            </Grid>
            <Grid item xs={12}>
              <TextField
                fullWidth
                label="Points"
                type="number"
                value={formData.points}
                onChange={(e) => setFormData({ ...formData, points: parseInt(e.target.value) })}
                required
              />
            </Grid>
          </Grid>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog}>Cancel</Button>
          <Button onClick={handleSubmit} variant="contained" color="primary">
            {selectedQuestion ? 'Update' : 'Add'}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={6000}
        onClose={() => setSnackbar({ ...snackbar, open: false })}
      >
        <Alert
          onClose={() => setSnackbar({ ...snackbar, open: false })}
          severity={snackbar.severity}
          sx={{ width: '100%' }}
        >
          {snackbar.message}
        </Alert>
      </Snackbar>
    </Box>
  );
};

export default VideoQuizManager; 