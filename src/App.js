import React from 'react';
import { ThemeProvider, createTheme, CssBaseline } from '@mui/material';
import Container from '@mui/material/Container';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import ScriptGenerator from './components/ScriptGenerator';

const theme = createTheme({
  palette: {
    mode: 'dark',
    primary: {
      main: '#448AFF',
    },
    secondary: {
      main: '#dc004e',
    },
    background: {
      default: '#121212',
      paper: '#2C2C2C',
    },
    text: {
      primary: '#E0E0E0',
      secondary: '#B0B0B0',
    },
  },
  typography: {
    fontFamily: '"Roboto", "Helvetica", "Arial", sans-serif',
    h3: {
      fontWeight: 500,
      color: '#1976d2',
    },
  },
  components: {
    MuiPaper: {
      styleOverrides: {
        root: {
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        },
      },
    },
    MuiButton: {
      styleOverrides: {
        root: {
          textTransform: 'none',
          borderRadius: 8,
        },
      },
    },
  },
});

function App() {
  return (
    <ThemeProvider theme={theme}>
      <CssBaseline />
      <Box sx={{ minHeight: '100vh', minWidth: '100vw', backgroundColor: 'background.default' }}>
        <Container maxWidth="lg">
          <Typography 
            variant="h3" 
            component="h1" 
            gutterBottom 
            align="center" 
            sx={{ 
              mb: 4,
              textShadow: '1px 1px 2px rgba(0,0,0,0.1)'
            }}
          >
            AI Script Generator
          </Typography>
          <ScriptGenerator />
        </Container>
      </Box>
    </ThemeProvider>
  );
}

export default App;
