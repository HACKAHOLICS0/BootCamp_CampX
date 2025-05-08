import React, { useState, useEffect } from 'react';
import CodeEditor from '@uiw/react-textarea-code-editor';
import { 
  Box, Typography, Select, MenuItem, FormControl, InputLabel, 
  Button, Alert, Stack, IconButton, Dialog, DialogTitle, 
  DialogContent, DialogActions, TextField, Snackbar,
  Drawer, List, ListItem, ListItemText, Divider, TextareaAutosize
} from '@mui/material';
import PlayArrowIcon from '@mui/icons-material/PlayArrow';
import SaveIcon from '@mui/icons-material/Save';
import FolderIcon from '@mui/icons-material/Folder';
import CloseIcon from '@mui/icons-material/Close';
import ChatIcon from '@mui/icons-material/Chat';
import SendIcon from '@mui/icons-material/Send';
import SmartToyIcon from '@mui/icons-material/SmartToy';

const CodeEditorInterface = () => {
  // Editor state
  const [code, setCode] = useState(`function add(a, b) {\n  return a + b;\n}\n\n// Example usage:\nconsole.log(add(2, 3));`);
  const [language, setLanguage] = useState('javascript');
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  
  // Snippets state
  const [snippets, setSnippets] = useState([]);
  const [openSaveDialog, setOpenSaveDialog] = useState(false);
  const [snippetName, setSnippetName] = useState('');
  const [openSnippetsDialog, setOpenSnippetsDialog] = useState(false);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  
  // Chatbot state
  const [chatOpen, setChatOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [userInput, setUserInput] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);

  const languages = ['javascript', 'python', 'html', 'css'];

  // Load saved snippets from localStorage
  useEffect(() => {
    const savedSnippets = localStorage.getItem('codeSnippets');
    if (savedSnippets) {
      setSnippets(JSON.parse(savedSnippets));
    }
  }, []);

  // Save snippets to localStorage
  useEffect(() => {
    localStorage.setItem('codeSnippets', JSON.stringify(snippets));
  }, [snippets]);

  // Code execution function
  const runCode = () => {
    setOutput('');
    setError('');
    
    try {
      if (language === 'javascript') {
        const originalConsoleLog = console.log;
        let logs = [];
        
        console.log = (...args) => {
          logs.push(args.join(' '));
          originalConsoleLog(...args);
        };
        
        new Function(code)();
        
        console.log = originalConsoleLog;
        setOutput(logs.join('\n'));
      } else if (language === 'html') {
        const newWindow = window.open();
        newWindow.document.write(code);
      } else if (language === 'css') {
        const newWindow = window.open();
        newWindow.document.write(`
          <!DOCTYPE html>
          <html>
          <head>
            <style>${code}</style>
          </head>
          <body>
            <h1>CSS Preview</h1>
            <div class="box">Sample div with your styles</div>
          </body>
          </html>
        `);
      } else {
        setOutput('Code execution is currently only supported for JavaScript, HTML, and CSS');
      }
    } catch (err) {
      setError(err.message);
    }
  };

  // Snippet management functions
  const saveToBlackbox = () => {
    if (!snippetName.trim()) {
      setSnackbarMessage('Please enter a name for your snippet');
      setSnackbarOpen(true);
      return;
    }

    const newSnippet = {
      id: Date.now(),
      name: snippetName,
      code,
      language,
      createdAt: new Date().toISOString()
    };

    setSnippets([...snippets, newSnippet]);
    setSnippetName('');
    setOpenSaveDialog(false);
    setSnackbarMessage('Snippet saved successfully!');
    setSnackbarOpen(true);
  };

  const loadSnippet = (snippet) => {
    setCode(snippet.code);
    setLanguage(snippet.language);
    setOpenSnippetsDialog(false);
    setOutput('');
    setError('');
  };

  const deleteSnippet = (id, e) => {
    e.stopPropagation();
    setSnippets(snippets.filter(snippet => snippet.id !== id));
    setSnackbarMessage('Snippet deleted successfully!');
    setSnackbarOpen(true);
  };

  // Chatbot functions
  const toggleChat = () => {
    setChatOpen(!chatOpen);
    if (!chatOpen && messages.length === 0) {
      setMessages([{
        id: 1,
        text: "Hello! I'm your coding assistant. Ask me anything about your code or for help with programming.",
        sender: 'ai'
      }]);
    }
  };

  const handleSendMessage = () => {
    if (!userInput.trim()) return;
    
    const newUserMessage = {
      id: Date.now(),
      text: userInput,
      sender: 'user'
    };
    
    setMessages([...messages, newUserMessage]);
    setUserInput('');
    setIsAiTyping(true);
    
    setTimeout(() => {
      const aiResponse = generateAIResponse(userInput, code, language);
      setMessages(prev => [...prev, {
        id: Date.now() + 1,
        text: aiResponse,
        sender: 'ai'
      }]);
      setIsAiTyping(false);
    }, 1000);
  };

  const generateAIResponse = (userInput, currentCode, currentLanguage) => {
    const lowerInput = userInput.toLowerCase();
    
    if (lowerInput.includes('what is this code') || lowerInput.includes('explain this code')) {
      return `This is a ${currentLanguage} code snippet. Here's a brief explanation:\n\n${explainCode(currentCode, currentLanguage)}`;
    }
    else if (lowerInput.includes('error') || lowerInput.includes('fix')) {
      return `I can help analyze potential errors. The most common issues in ${currentLanguage} are:\n${getCommonErrors(currentLanguage)}\n\nTry checking these in your code.`;
    }
    else if (lowerInput.includes('optimize') || lowerInput.includes('improve')) {
      return `Here are some optimization suggestions for your ${currentLanguage} code:\n${getOptimizationTips(currentLanguage)}`;
    }
    else {
      return `I can help you with ${currentLanguage} programming. For specific help, you can ask:\n- "Explain this code"\n- "Find errors in this code"\n- "How to optimize this?"\n- "Show me examples of ${currentLanguage} functions"`;
    }
  };

  const explainCode = (code, lang) => {
    if (lang === 'javascript') {
      return `This JavaScript code appears to be ${code.includes('function') ? 'a function' : 'a script'}.`;
    } else if (lang === 'python') {
      return 'This Python code contains important logic. Python uses indentation for blocks.';
    }
    return `This ${lang} code performs specific operations.`;
  };

  const getCommonErrors = (lang) => {
    if (lang === 'javascript') {
      return "- Missing semicolons\n- Undefined variables\n- Async/await issues\n- Scope problems";
    }
    return "Common errors include syntax mistakes and logical errors.";
  };

  const getOptimizationTips = (lang) => {
    if (lang === 'javascript') {
      return "- Use const/let instead of var\n- Avoid nested loops when possible\n- Cache DOM queries\n- Use arrow functions for concise syntax";
    }
    return "Consider algorithm efficiency and code readability.";
  };

  return (
    <Box sx={{
      display: 'flex',
      flexDirection: 'column',
      height: '100%',
      backgroundColor: '#f5f5f5',
      borderRadius: '8px',
      overflow: 'hidden',
      boxShadow: '0 2px 10px rgba(0,0,0,0.1)',
      position: 'relative'
    }}>
      {/* Header */}
      <Box sx={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        padding: '12px 16px',
        backgroundColor: '#2d2d2d',
        color: '#fff'
      }}>
        <Typography variant="h6">Code Editor</Typography>
        <Stack direction="row" spacing={2} alignItems="center">
          <FormControl size="small" sx={{ minWidth: 120 }}>
            <InputLabel id="language-select-label" sx={{ color: '#fff' }}>Language</InputLabel>
            <Select
              labelId="language-select-label"
              value={language}
              label="Language"
              onChange={(e) => setLanguage(e.target.value)}
              sx={{
                color: '#fff',
                '& .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#555',
                },
                '&:hover .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#777',
                },
                '&.Mui-focused .MuiOutlinedInput-notchedOutline': {
                  borderColor: '#fff',
                },
              }}
            >
              {languages.map((lang) => (
                <MenuItem key={lang} value={lang}>
                  {lang.charAt(0).toUpperCase() + lang.slice(1)}
                </MenuItem>
              ))}
            </Select>
          </FormControl>
          <Button
            variant="contained"
            color="success"
            startIcon={<PlayArrowIcon />}
            onClick={runCode}
            sx={{
              backgroundColor: '#4CAF50',
              '&:hover': {
                backgroundColor: '#388E3C',
              }
            }}
          >
            Run Code
          </Button>
          <Button
            variant="contained"
            color="primary"
            startIcon={<SaveIcon />}
            onClick={() => setOpenSaveDialog(true)}
            sx={{
              backgroundColor: '#2196F3',
              '&:hover': {
                backgroundColor: '#0b7dda',
              }
            }}
          >
            Save
          </Button>
          <Button
            variant="contained"
            color="secondary"
            startIcon={<FolderIcon />}
            onClick={() => setOpenSnippetsDialog(true)}
            sx={{
              backgroundColor: '#9C27B0',
              '&:hover': {
                backgroundColor: '#7B1FA2',
              }
            }}
          >
            My Snippets
          </Button>
          <Button
            variant="contained"
            color="info"
            startIcon={<ChatIcon />}
            onClick={toggleChat}
            sx={{
              backgroundColor: '#00ACC1',
              '&:hover': {
                backgroundColor: '#00838F',
              }
            }}
          >
            Code Assistant
          </Button>
        </Stack>
      </Box>

      {/* Main Content */}
      <Box sx={{ display: 'flex', flex: 1, overflow: 'hidden' }}>
        {/* Editor Area */}
        <Box sx={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
          <Box sx={{ flex: 1, overflow: 'auto' }}>
            <CodeEditor
              value={code}
              language={language}
              placeholder={`Enter your ${language} code here...`}
              onChange={(evn) => setCode(evn.target.value)}
              padding={15}
              style={{
                fontSize: 14,
                backgroundColor: '#1e1e1e',
                fontFamily: 'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
                height: '100%',
                minHeight: '300px'
              }}
            />
          </Box>
          
          <Box sx={{
            padding: '16px',
            backgroundColor: '#1e1e1e',
            color: '#fff',
            minHeight: '150px',
            borderTop: '1px solid #333'
          }}>
            <Typography variant="subtitle1" gutterBottom sx={{ color: '#fff' }}>
              Output
            </Typography>
            {error && (
              <Alert severity="error" sx={{ mb: 2 }}>
                {error}
              </Alert>
            )}
            <Box sx={{
              backgroundColor: '#2d2d2d',
              padding: '12px',
              borderRadius: '4px',
              fontFamily: 'monospace',
              whiteSpace: 'pre-wrap',
              minHeight: '50px'
            }}>
              {output || 'Run your code to see the output here...'}
            </Box>
          </Box>
        </Box>

        {/* Chatbot Drawer */}
        <Drawer
          anchor="right"
          open={chatOpen}
          onClose={toggleChat}
          sx={{
            '& .MuiDrawer-paper': {
              width: '350px',
              boxSizing: 'border-box',
            },
          }}
        >
          <Box sx={{
            display: 'flex',
            flexDirection: 'column',
            height: '100%',
            backgroundColor: '#f9f9f9'
          }}>
            <Box sx={{
              p: 2,
              backgroundColor: '#2d2d2d',
              color: 'white',
              display: 'flex',
              alignItems: 'center'
            }}>
              <SmartToyIcon sx={{ mr: 1 }} />
              <Typography variant="h6">Code Assistant</Typography>
            </Box>

            <Box sx={{
              flex: 1,
              overflowY: 'auto',
              p: 2,
              backgroundColor: '#fff'
            }}>
              <List>
                {messages.map((message) => (
                  <ListItem key={message.id} sx={{
                    flexDirection: 'column',
                    alignItems: message.sender === 'user' ? 'flex-end' : 'flex-start',
                    px: 1,
                    py: 0.5
                  }}>
                    <Box sx={{
                      maxWidth: '80%',
                      p: 1.5,
                      borderRadius: message.sender === 'user' 
                        ? '18px 18px 0 18px' 
                        : '18px 18px 18px 0',
                      backgroundColor: message.sender === 'user' 
                        ? '#e3f2fd' 
                        : '#f1f1f1',
                      boxShadow: 1,
                      mb: 1
                    }}>
                      <Typography variant="body1" sx={{ whiteSpace: 'pre-wrap' }}>
                        {message.text}
                      </Typography>
                    </Box>
                    <Typography variant="caption" color="text.secondary">
                      {message.sender === 'user' ? 'You' : 'AI Assistant'}
                    </Typography>
                  </ListItem>
                ))}
                {isAiTyping && (
                  <ListItem sx={{ justifyContent: 'flex-start' }}>
                    <Box sx={{
                      p: 1.5,
                      borderRadius: '18px 18px 18px 0',
                      backgroundColor: '#f1f1f1'
                    }}>
                      <Typography variant="body1">Typing...</Typography>
                    </Box>
                  </ListItem>
                )}
              </List>
            </Box>

            <Box sx={{ p: 2, borderTop: '1px solid #e0e0e0' }}>
              <Box sx={{ display: 'flex', alignItems: 'center' }}>
                <TextareaAutosize
                  minRows={2}
                  maxRows={4}
                  placeholder="Ask about your code..."
                  value={userInput}
                  onChange={(e) => setUserInput(e.target.value)}
                  onKeyPress={(e) => e.key === 'Enter' && !e.shiftKey && handleSendMessage()}
                  style={{
                    width: '100%',
                    padding: '10px',
                    borderRadius: '4px',
                    border: '1px solid #ddd',
                    resize: 'none',
                    fontFamily: 'inherit',
                    fontSize: '14px'
                  }}
                />
                <IconButton 
                  color="primary" 
                  onClick={handleSendMessage}
                  disabled={!userInput.trim()}
                  sx={{ ml: 1 }}
                >
                  <SendIcon />
                </IconButton>
              </Box>
              <Typography variant="caption" color="text.secondary" sx={{ mt: 1, display: 'block' }}>
                Tip: Ask "How can I optimize this?" or "Explain this function"
              </Typography>
            </Box>
          </Box>
        </Drawer>
      </Box>

      {/* Save Snippet Dialog */}
      <Dialog open={openSaveDialog} onClose={() => setOpenSaveDialog(false)}>
        <DialogTitle>Save Code Snippet</DialogTitle>
        <DialogContent>
          <TextField
            autoFocus
            margin="dense"
            label="Snippet Name"
            fullWidth
            variant="outlined"
            value={snippetName}
            onChange={(e) => setSnippetName(e.target.value)}
          />
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSaveDialog(false)}>Cancel</Button>
          <Button onClick={saveToBlackbox} color="primary">Save</Button>
        </DialogActions>
      </Dialog>

      {/* Snippets Dialog */}
      <Dialog 
        open={openSnippetsDialog} 
        onClose={() => setOpenSnippetsDialog(false)}
        fullWidth
        maxWidth="md"
      >
        <DialogTitle>My Code Snippets</DialogTitle>
        <DialogContent>
          {snippets.length === 0 ? (
            <Typography variant="body1" sx={{ textAlign: 'center', py: 4 }}>
              No snippets saved yet
            </Typography>
          ) : (
            <Box sx={{ 
              display: 'grid', 
              gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', 
              gap: 2,
              maxHeight: '60vh',
              overflow: 'auto',
              p: 1
            }}>
              {snippets.map((snippet) => (
                <Box 
                  key={snippet.id}
                  onClick={() => loadSnippet(snippet)}
                  sx={{
                    p: 2,
                    border: '1px solid #ddd',
                    borderRadius: 1,
                    cursor: 'pointer',
                    '&:hover': {
                      backgroundColor: '#f5f5f5'
                    },
                    position: 'relative'
                  }}
                >
                  <Typography variant="subtitle1" fontWeight="bold">
                    {snippet.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary">
                    {snippet.language.toUpperCase()} • {new Date(snippet.createdAt).toLocaleString()}
                  </Typography>
                  <Box sx={{
                    mt: 1,
                    backgroundColor: '#1e1e1e',
                    color: '#fff',
                    p: 1,
                    borderRadius: 1,
                    maxHeight: '100px',
                    overflow: 'hidden',
                    textOverflow: 'ellipsis',
                    fontFamily: 'monospace',
                    fontSize: '0.8rem'
                  }}>
                    {snippet.code}
                  </Box>
                  <IconButton
                    size="small"
                    onClick={(e) => deleteSnippet(snippet.id, e)}
                    sx={{
                      position: 'absolute',
                      top: 4,
                      right: 4,
                      color: 'error.main'
                    }}
                  >
                    <CloseIcon fontSize="small" />
                  </IconButton>
                </Box>
              ))}
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setOpenSnippetsDialog(false)}>Close</Button>
        </DialogActions>
      </Dialog>

      {/* Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
        message={snackbarMessage}
      />
    </Box>
  );
};

export default CodeEditorInterface;