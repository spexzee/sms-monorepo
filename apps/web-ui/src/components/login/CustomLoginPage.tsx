import React, { useEffect, useRef } from 'react';
import { Box } from '@mui/material';

interface CustomLoginPageProps {
  /** The raw HTML string to render as the entire login page */
  html: string;
  /** Called when the custom HTML fires a postMessage login event */
  onLoginSubmit?: (payload: { email: string; password: string }) => void;
}

/**
 * CustomLoginPage
 *
 * Renders a school's fully custom login page HTML as an iframe.
 * Using an iframe provides sandboxing — the HTML cannot access parent JS context.
 *
 * Communication with the custom page (e.g. form submit) is done via postMessage:
 *   window.parent.postMessage({ type: 'SMS_LOGIN', email: '...', password: '...' }, '*')
 *
 * The school's custom HTML should call the above when the login button is clicked.
 * The actual login API call is still performed by this parent component.
 */
const CustomLoginPage: React.FC<CustomLoginPageProps> = ({ html, onLoginSubmit }) => {
  const iframeRef = useRef<HTMLIFrameElement>(null);

  // Write the HTML into the iframe
  useEffect(() => {
    const iframe = iframeRef.current;
    if (!iframe) return;

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (!doc) return;

    doc.open();
    doc.write(html);
    doc.close();
  }, [html]);

  // Listen for postMessage events from the custom HTML
  useEffect(() => {
    const handleMessage = (event: MessageEvent) => {
      if (event.data?.type === 'SMS_LOGIN' && onLoginSubmit) {
        onLoginSubmit({
          email: event.data.email || '',
          password: event.data.password || '',
        });
      }
    };

    window.addEventListener('message', handleMessage);
    return () => window.removeEventListener('message', handleMessage);
  }, [onLoginSubmit]);

  return (
    <Box sx={{ width: '100%', height: '100vh', overflow: 'hidden' }}>
      <iframe
        ref={iframeRef}
        title="Custom School Login"
        style={{
          width: '100%',
          height: '100%',
          border: 'none',
          display: 'block',
        }}
        sandbox="allow-scripts allow-same-origin allow-forms"
      />
    </Box>
  );
};

export default CustomLoginPage;
