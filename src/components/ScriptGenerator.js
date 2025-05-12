import React, { useState } from 'react';
import {
  Box,
  TextField,
  Button,
  Slider,
  Typography,
  Paper,
  Grid,
  IconButton,
  Divider,
  Alert,
  CircularProgress,
  Snackbar,
  Container,
} from '@mui/material';
import RefreshIcon from '@mui/icons-material/Refresh';
import ContentCopyIcon from '@mui/icons-material/ContentCopy';
import { generateScript, regenerateParagraph, regenerateSegment } from '../services/api';

const ScriptGenerator = () => {
  const [title, setTitle] = useState('');
  const [inspirationalTranscript, setInspirationalTranscript] = useState('');
  const [wordCount, setWordCount] = useState(5000);
  const [generatedScript, setGeneratedScript] = useState([]);
  const [forbiddenWords, setForbiddenWords] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [regeneratingIndex, setRegeneratingIndex] = useState(null);
  const [snackbar, setSnackbar] = useState({ open: false, message: '' });
  const [totalWords, setTotalWords] = useState(0);
  const [uploadedFile, setUploadedFile] = useState(null);
  const [structurePrompt, setStructurePrompt] = useState('');
  const [scriptSegments, setScriptSegments] = useState([]);
  const [regeneratingSegmentIndex, setRegeneratingSegmentIndex] = useState(null);

  const handleWordCountChange = (event, newValue) => {
    setWordCount(newValue);
  };

  const handleGenerateScript = async () => {
    if (!title) {
      setError('Please fill in the title');
      return;
    }
  
    setLoading(true);
    setError('');
  
    try {
      const data = await generateScript({
        title,
        inspirational_transcript: inspirationalTranscript,
        word_count: wordCount,
        forbidden_words: forbiddenWords
          .split(',')
          .map(word => word.trim())
          .filter(Boolean),
        structure_prompt: structurePrompt,
      });
  
      let paragraphs = data.paragraphs;
      setTotalWords(data.total_words);
  
      // Handle case where paragraphs is a single stringified JSON array
      if (Array.isArray(paragraphs) && paragraphs.length === 1 && typeof paragraphs[0] === 'string') {
        const rawText = paragraphs[0];
        const jsonStart = rawText.indexOf('[');
        const jsonEnd = rawText.lastIndexOf(']') + 1;
  
        if (jsonStart !== -1 && jsonEnd !== -1) {
          let jsonString = rawText.slice(jsonStart, jsonEnd);
  
          // Clean up common formatting issues
          jsonString = jsonString
            .replace(/,\s*]/g, ']')         // Remove trailing commas before ]
            .replace(/,\s*}/g, '}')         // Remove trailing commas before }
            .replace(/\n/g, ' ')            // Remove line breaks
            .replace(/\\n/g, ' ')           // Unescape line breaks
            .replace(/\\"/g, '"');          // Unescape double quotes
  
          try {
            let parsed = JSON.parse(jsonString);
  
            // If still a stringified JSON, parse again
            if (typeof parsed === 'string') {
              parsed = JSON.parse(parsed);
            }
  
            if (Array.isArray(parsed)) {
              paragraphs = parsed;
            } else {
              throw new Error('Parsed paragraphs is not an array');
            }
          } catch (parseError) {
            console.error('JSON Parsing Error:', parseError);
  
            // Try to split the string into paragraphs using regex
            let fallback = jsonString
              .replace(/^\s*\[\s*/, '') // remove leading [
              .replace(/\s*\]\s*$/, '') // remove trailing ]
              .split(/"\s*,\s*"/g)      // split by "," (with possible whitespace)
              .map(s => s.replace(/^"+|"+$/g, '').trim()) // remove leading/trailing quotes
              .filter(Boolean);
  
            if (fallback.length > 1) {
              paragraphs = fallback;
            } else {
              // Try splitting by sentence or double newlines as a last resort
              fallback = rawText.split(/\n{2,}|(?<=[.!?])\s{2,}/g).map(s => s.trim()).filter(Boolean);
              if (fallback.length > 1) {
                paragraphs = fallback;
              } else {
                // fallback to the whole string as one paragraph
                paragraphs = [rawText];
              }
            }
          }
        }
      }
  
      // Ensure paragraphs is an array of strings
      if (!Array.isArray(paragraphs)) {
        paragraphs = [String(paragraphs)];
      }
  
      // Format into displayable objects
      const formattedParagraphs = paragraphs.map((content, index) => ({
        id: index,
        content: String(content).trim().replace(/^["']|["']$/g, ''),
      }));
  
      setGeneratedScript(formattedParagraphs);
      setScriptSegments(groupParagraphsByWordCount(formattedParagraphs.map(p => p.content)));
    } catch (err) {
      console.error('Script generation failed:', err);
      setError(err.message || 'An error occurred while generating the script.');
    } finally {
      setLoading(false);
    }
  };
  
  

  const handleRegenerateParagraph = async (index) => {
    setRegeneratingIndex(index);
    try {
      const oldParagraph = generatedScript[index]?.content || '';
      const data = await regenerateParagraph({
        paragraph_index: index,
        context: generatedScript.map(p => p.content).join('\n'),
        old_paragraph: oldParagraph,
      });
      let newContent = data.content;
      const wordDiff = data.word_diff || 0;

      const newScript = [...generatedScript];
      newScript[index] = { ...newScript[index], content: newContent || '' };
      setGeneratedScript(newScript);
      setTotalWords((prev) => prev + wordDiff);
      setSnackbar({ open: true, message: 'Paragraph regenerated successfully' });
    } catch (err) {
      setError(err.message);
    } finally {
      setRegeneratingIndex(null);
    }
  };

  const handleCopyToClipboard = (text) => {
    navigator.clipboard.writeText(text);
    setSnackbar({ open: true, message: 'Copied to clipboard' });
  };

  const handleCloseSnackbar = () => {
    setSnackbar({ ...snackbar, open: false });
  };

  const handleRegenerateSegment = async (segmentIndex) => {
    try {
      setRegeneratingSegmentIndex(segmentIndex);
      const segment = scriptSegments[segmentIndex];
      const contextBefore = scriptSegments
        .slice(0, segmentIndex)
        .map(s => s.content)
        .join('\n\n');
      const contextAfter = scriptSegments
        .slice(segmentIndex + 1)
        .map(s => s.content)
        .join('\n\n');

      const response = await regenerateSegment({
        context_before: contextBefore,
        context_after: contextAfter,
        segment_word_count: segment.wordCount,
        title,
        inspirational_transcript: inspirationalTranscript,
        forbidden_words: forbiddenWords.split(',').map(word => word.trim()).filter(Boolean),
        structure_prompt: structurePrompt
      });

      if (!response || !response.content) {
        throw new Error('Invalid response from server');
      }

      const newSegments = [...scriptSegments];
      newSegments[segmentIndex] = {
        content: response.content,
        wordCount: response.wordCount || response.content.split(/\s+/).length
      };
      setScriptSegments(newSegments);
      
      // Update total word count
      const newTotalWords = newSegments.reduce((sum, segment) => sum + segment.wordCount, 0);
      setTotalWords(newTotalWords);
    } catch (error) {
      console.error('Error regenerating segment:', error);
      setError(error.message || 'Failed to regenerate segment. Please try again.');
    } finally {
      setRegeneratingSegmentIndex(null);
    }
  };

  const handleCopySegment = (content) => {
    navigator.clipboard.writeText(content)
      .then(() => {
        setError('Segment copied to clipboard!');
      })
      .catch((err) => {
        console.error('Failed to copy:', err);
        setError('Failed to copy segment');
      });
  };

  const groupParagraphsByWordCount = (paragraphs) => {
    const segments = [];
    let currentSegment = [];
    let currentWordCount = 0;

    paragraphs.forEach((paragraph) => {
      const paragraphWordCount = paragraph.split(/\s+/).length;
      if (currentWordCount + paragraphWordCount > 500) {
        if (currentSegment.length > 0) {
          segments.push({
            content: currentSegment.join('\n\n'),
            wordCount: currentWordCount
          });
          currentSegment = [];
          currentWordCount = 0;
        }
      }
      currentSegment.push(paragraph);
      currentWordCount += paragraphWordCount;
    });

    if (currentSegment.length > 0) {
      segments.push({
        content: currentSegment.join('\n\n'),
        wordCount: currentWordCount
      });
    }

    return segments;
  };

  return (
    <Box sx={{ width: '100%', minHeight: '100vh', backgroundColor: '#121212', color: '#E0E0E0' }}>
      {error && (
        <Alert severity="error" sx={{ mb: 2 }} onClose={() => setError('')}>
          {error}
        </Alert>
      )}
      
      <Grid container spacing={3} sx={{ width: '100%' }}>
        <Grid item xs={12} sx={{ width: '100%' }}>
          <Paper
            sx={{
              p: 6,
              maxWidth: 900,
              mx: 'auto',
              minHeight: 400,
              fontSize: '1.15rem',
              mt: 6,
              backgroundColor: '#2C2C2C',
              color: '#E0E0E0',
              boxShadow: '0 8px 32px 0 rgba(31, 38, 135, 0.37)',
              borderRadius: 4,
            }}
          >
            <Typography
              variant="h4"
              align="center"
              gutterBottom
              sx={{ fontWeight: 700, mb: 4, color: '#E0E0E0' }}
            >
              Script Generation Settings
            </Typography>
            <TextField
              fullWidth
              label="Video Title"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              margin="normal"
              required
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Inspirational Video Transcript (Optional)"
              multiline
              rows={4}
              value={inspirationalTranscript}
              onChange={(e) => setInspirationalTranscript(e.target.value)}
              margin="normal"
              placeholder="Paste the transcript of a video that inspires the style and structure you want..."
            />
            {/* File upload for transcript */}
            <Button
              variant="outlined"
              component="label"
              sx={{ mt: 1, mb: 2 }}
              disabled={loading || uploadedFile !== null}
            >
              Upload Transcript File
              <input
                type="file"
                accept=".txt,.md,text/plain"
                hidden
                onChange={async (e) => {
                  const file = e.target.files && e.target.files[0];
                  if (file) {
                    const text = await file.text();
                    setInspirationalTranscript(text);
                    setUploadedFile(file);
                  }
                }}
              />
            </Button>
            {uploadedFile && (
              <Box sx={{ display: 'flex', alignItems: 'center', mb: 1 }}>
                <Typography variant="body2" sx={{ mr: 2 }}>
                  Uploaded: {uploadedFile.name}
                </Typography>
                <Button
                  size="small"
                  color="secondary"
                  onClick={() => {
                    setUploadedFile(null);
                    setInspirationalTranscript('');
                  }}
                >
                  Remove
                </Button>
              </Box>
            )}
            <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 1 }}>
              Allowed file types: .txt, .md
            </Typography>
            <TextField
              fullWidth
              label="Forbidden Words (comma-separated)"
              value={forbiddenWords}
              onChange={(e) => setForbiddenWords(e.target.value)}
              margin="normal"
              helperText="Enter words separated by commas that should not appear in the script"
              disabled={loading}
            />
            <TextField
              fullWidth
              label="Structure Prompt (optional)"
              value={structurePrompt}
              onChange={(e) => setStructurePrompt(e.target.value)}
              margin="normal"
              multiline
              rows={5}
              InputProps={{ sx: { fontSize: '1.15rem', py: 2 } }}
              helperText="Describe the structure you want for your story (e.g., '3 acts: setup, conflict, resolution', 'Hero's Journey', etc.)"
              disabled={loading}
              sx={{ mt: 2 }}
            />
            <Box sx={{ mt: 2 }}>
              <Typography gutterBottom>
                Target Word Count: {wordCount}
              </Typography>
              <Slider
                value={wordCount}
                onChange={handleWordCountChange}
                min={1000}
                max={100000}
                step={500}
                valueLabelDisplay="auto"
                disabled={loading}
                marks={[
                  { value: 1000, label: '1K' },
                  { value: 10000, label: '10K' },
                  { value: 50000, label: '50K' },
                  { value: 100000, label: '100K' },
                ]}
                sx={{ mt: 2 }}
              />
              <Typography variant="caption" color="text.secondary">
                Select the target word count (up to 100,000 words). Note: very large scripts may take longer to generate.
              </Typography>
            </Box>
            <Button
              variant="contained"
              color="primary"
              sx={{
                mt: 2,
                backgroundColor: '#448AFF',
                color: '#121212',
                fontWeight: 700,
                '&:hover': { backgroundColor: '#2979FF' },
              }}
              onClick={handleGenerateScript}
              disabled={loading}
              startIcon={loading && <CircularProgress size={20} color="inherit" />}
            >
              {loading ? 'Generating...' : 'Generate Script'}
            </Button>
          </Paper>
        </Grid>

        {scriptSegments.length > 0 && (
          <Grid item xs={12}>
            <Paper sx={{ p: 6, maxWidth: 1100, mx: 'auto', minHeight: 600, fontSize: '1.15rem', backgroundColor: '#2C2C2C', color: '#E0E0E0' }}>
              <Typography variant="h6" gutterBottom sx={{ color: '#E0E0E0' }}>
                Generated Script
              </Typography>
              {scriptSegments.length > 0 && (
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', alignItems: 'center', mb: 2 }}>
                  <Typography
                    variant="subtitle1"
                    sx={{
                      backgroundColor: '#232946',
                      color: '#448AFF',
                      px: 2,
                      py: 1,
                      borderRadius: 2,
                      fontWeight: 500,
                      fontSize: '1.1rem',
                      boxShadow: '0 1px 4px rgba(25, 118, 210, 0.08)'
                    }}
                  >
                    Total Words: {totalWords}
                  </Typography>
                </Box>
              )}
              {/* Display script in 500-word segments */}
              <Box sx={{ mt: 4 }}>
                <Typography variant="h5" gutterBottom>
                  Generated Script ({totalWords} words)
                </Typography>
                {scriptSegments.map((segment, index) => (
                  <Paper
                    key={index}
                    elevation={3}
                    sx={{
                      p: 3,
                      mb: 2,
                      backgroundColor: 'background.paper',
                      position: 'relative'
                    }}
                  >
                    <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', mb: 2 }}>
                      <Typography variant="subtitle1" color="text.secondary">
                        Segment {index + 1} ({segment.wordCount} words)
                      </Typography>
                      <Box>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleCopySegment(segment.content)}
                          startIcon={<ContentCopyIcon />}
                          sx={{ mr: 1 }}
                        >
                          Copy Segment
                        </Button>
                        <Button
                          variant="outlined"
                          size="small"
                          onClick={() => handleRegenerateSegment(index)}
                          startIcon={regeneratingSegmentIndex === index ? <CircularProgress size={20} /> : <RefreshIcon />}
                          disabled={regeneratingSegmentIndex === index}
                          sx={{
                            mr: 1,
                            backgroundColor: regeneratingSegmentIndex === index ? 'rgba(0, 0, 0, 0.12)' : 'transparent',
                            '&:hover': {
                              backgroundColor: regeneratingSegmentIndex === index ? 'rgba(0, 0, 0, 0.12)' : 'rgba(0, 0, 0, 0.04)'
                            }
                          }}
                        >
                          {regeneratingSegmentIndex === index ? 'Regenerating...' : 'Regenerate Segment'}
                        </Button>
                      </Box>
                    </Box>
                    <Typography
                      variant="body1"
                      sx={{
                        whiteSpace: 'pre-wrap',
                        fontFamily: 'inherit',
                        lineHeight: 1.6
                      }}
                    >
                      {segment.content}
                    </Typography>
                  </Paper>
                ))}
              </Box>
            </Paper>
          </Grid>
        )}
      </Grid>

      <Snackbar
        open={snackbar.open}
        autoHideDuration={3000}
        onClose={handleCloseSnackbar}
        message={snackbar.message}
      />
    </Box>

  );
};

export default ScriptGenerator; 