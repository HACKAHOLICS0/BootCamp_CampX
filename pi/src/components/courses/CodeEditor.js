import React, { useState } from 'react';
import CodeEditor from '@uiw/react-textarea-code-editor';
import { Button, Card, Alert } from 'react-bootstrap';
import './CodeEditor.css';

const LanguageCodeEditor = ({ 
  language = 'javascript', 
  initialCode = '', 
  height = '300px',
  readOnly = false,
  runnable = true,
  onCodeChange = () => {},
  exerciseValidation = null // Function to validate code (returns { success: boolean, message: string })
}) => {
  const [code, setCode] = useState(initialCode);
  const [output, setOutput] = useState('');
  const [error, setError] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  // Map of language to syntax highlighting
  const languageMap = {
    javascript: 'js',
    typescript: 'ts',
    python: 'py',
    java: 'java',
    csharp: 'cs',
    sql: 'sql',
    mongodb: 'js', // MongoDB uses JavaScript syntax for queries
    html: 'html',
    css: 'css',
    php: 'php',
    ruby: 'ruby',
    go: 'go',
    rust: 'rust',
    swift: 'swift',
    kotlin: 'kotlin',
    scala: 'scala',
    r: 'r',
    shell: 'sh',
    powershell: 'ps1',
    bash: 'bash',
    dockerfile: 'dockerfile',
    yaml: 'yaml',
    json: 'json',
    xml: 'xml',
    markdown: 'md'
  };

  // Function to handle code changes
  const handleCodeChange = (evn) => {
    const newCode = evn.target.value;
    setCode(newCode);
    onCodeChange(newCode);
  };

  // Function to run the code
  const runCode = () => {
    setError('');
    setOutput('');
    setIsSuccess(false);

    try {
      switch (language) {
        case 'javascript':
          // For JavaScript, we can use eval (with caution)
          try {
            // Create a sandbox function to run the code
            const sandbox = new Function(`
              try {
                // Capture console.log output
                const logs = [];
                const originalConsoleLog = console.log;
                console.log = (...args) => {
                  logs.push(args.map(arg => 
                    typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg
                  ).join(' '));
                  originalConsoleLog(...args);
                };
                
                ${code}
                
                // Restore original console.log
                console.log = originalConsoleLog;
                return { success: true, output: logs.join('\\n') };
              } catch (error) {
                return { success: false, error: error.toString() };
              }
            `);
            
            const result = sandbox();
            if (result.success) {
              setOutput(result.output || 'Code executed successfully (no output)');
            } else {
              setError(result.error);
            }
          } catch (error) {
            setError(error.toString());
          }
          break;

        case 'html':
          // For HTML, we can render it in an iframe
          const iframe = document.createElement('iframe');
          iframe.style.width = '100%';
          iframe.style.height = '300px';
          iframe.style.border = 'none';
          
          // Create a blob URL from the HTML code
          const blob = new Blob([code], { type: 'text/html' });
          const url = URL.createObjectURL(blob);
          
          // Set the iframe source to the blob URL
          iframe.src = url;
          
          // Clear previous output
          setOutput('HTML rendered in iframe below');
          
          // Append the iframe to the output container
          const outputContainer = document.getElementById('output-container');
          if (outputContainer) {
            outputContainer.innerHTML = '';
            outputContainer.appendChild(iframe);
          }
          break;

        case 'css':
          // For CSS, we can apply it to a div
          const styleElement = document.createElement('style');
          styleElement.textContent = code;
          
          // Create a div to apply the CSS to
          const div = document.createElement('div');
          div.innerHTML = `
            <div class="css-preview">
              <div class="box">Box 1</div>
              <div class="box">Box 2</div>
              <div class="box">Box 3</div>
            </div>
          `;
          
          // Clear previous output
          setOutput('CSS applied to elements below');
          
          // Append the style and div to the output container
          const cssOutputContainer = document.getElementById('output-container');
          if (cssOutputContainer) {
            cssOutputContainer.innerHTML = '';
            cssOutputContainer.appendChild(styleElement);
            cssOutputContainer.appendChild(div);
          }
          break;

        case 'sql':
          // For SQL, we can't actually run it in the browser
          // We would need a backend service to execute SQL queries
          setOutput('SQL execution is simulated. In a real environment, this would be sent to a database server.');
          break;

        case 'mongodb':
          // For MongoDB, we can't actually run it in the browser
          // We would need a backend service to execute MongoDB queries
          setOutput('MongoDB execution is simulated. In a real environment, this would be sent to a MongoDB server.');
          break;

        default:
          setOutput(`Execution for ${language} is not supported in the browser environment.`);
      }

      // If there's a validation function, run it
      if (exerciseValidation) {
        const validationResult = exerciseValidation(code);
        if (validationResult.success) {
          setIsSuccess(true);
          setOutput((prevOutput) => `${prevOutput}\n\n✅ ${validationResult.message}`);
        } else {
          setError(validationResult.message);
        }
      }
    } catch (error) {
      setError(`Error executing code: ${error.toString()}`);
    }
  };

  // Function to reset the code to initial value
  const resetCode = () => {
    setCode(initialCode);
    setOutput('');
    setError('');
    setIsSuccess(false);
  };

  return (
    <div className="language-code-editor">
      <Card>
        <Card.Header className="d-flex justify-content-between align-items-center">
          <div>
            <strong>{language.charAt(0).toUpperCase() + language.slice(1)} Editor</strong>
          </div>
          {!readOnly && runnable && (
            <div>
              <Button variant="primary" onClick={runCode} className="me-2">
                Run Code
              </Button>
              <Button variant="secondary" onClick={resetCode}>
                Reset
              </Button>
            </div>
          )}
        </Card.Header>
        <Card.Body>
          <CodeEditor
            value={code}
            language={languageMap[language] || language}
            placeholder={`Please enter ${language} code.`}
            onChange={handleCodeChange}
            padding={15}
            style={{
              fontSize: 14,
              backgroundColor: "#f5f5f5",
              fontFamily: 'ui-monospace,SFMono-Regular,SF Mono,Consolas,Liberation Mono,Menlo,monospace',
              height: height,
              overflowY: 'auto',
              border: '1px solid #ddd',
              borderRadius: '4px',
            }}
            disabled={readOnly}
          />
          
          {(output || error) && (
            <div className="mt-3">
              <h5>Output:</h5>
              <div id="output-container" className="output-container">
                {output && <pre className={`output ${isSuccess ? 'success' : ''}`}>{output}</pre>}
                {error && <Alert variant="danger">{error}</Alert>}
              </div>
            </div>
          )}
        </Card.Body>
      </Card>
    </div>
  );
};

export default LanguageCodeEditor;
