import React, { useState } from 'react';
import { Globe, Download, AlertCircle, Loader2 } from 'lucide-react';

interface PageReaderProps {}

const PageReader: React.FC<PageReaderProps> = () => {
  const [url, setUrl] = useState('');
  const [htmlContent, setHtmlContent] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [lastFetchedUrl, setLastFetchedUrl] = useState('');

  const corsProxies = [
    'https://api.allorigins.win/raw?url=',
    'https://cors-anywhere.herokuapp.com/',
    'https://corsproxy.io/?'
  ];

  const isValidUrl = (string: string) => {
    try {
      const newUrl = new URL(string);
      return newUrl.protocol === 'http:' || newUrl.protocol === 'https:';
    } catch (err) {
      return false;
    }
  };

  const fetchPageContent = async () => {
    if (!url.trim()) {
      setError('Please enter a valid URL');
      return;
    }

    if (!isValidUrl(url)) {
      setError('Please enter a valid HTTP/HTTPS URL');
      return;
    }

    setLoading(true);
    setError('');
    setHtmlContent('');

    try {
      // Try different CORS proxies
      let response;
      let lastError;

      for (const proxy of corsProxies) {
        try {
          const proxyUrl = proxy + encodeURIComponent(url);
          response = await fetch(proxyUrl, {
            method: 'GET',
            headers: {
              'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36'
            }
          });

          if (response.ok) {
            break;
          }
        } catch (err) {
          lastError = err;
          continue;
        }
      }

      if (!response || !response.ok) {
        throw new Error(`Failed to fetch: ${response?.status || 'Network error'}`);
      }

      const html = await response.text();
      setHtmlContent(html);
      setLastFetchedUrl(url);
    } catch (err) {
      console.error('Error fetching page:', err);
      setError(`Failed to fetch page content. This might be due to CORS restrictions or the page being unavailable. Error: ${err instanceof Error ? err.message : 'Unknown error'}`);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    fetchPageContent();
  };

  const downloadHtml = () => {
    if (!htmlContent) return;

    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `page-${Date.now()}.html`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 p-4">
      <div className="max-w-7xl mx-auto">
        <div className="bg-white rounded-xl shadow-lg p-6 mb-6">
          <div className="flex items-center gap-3 mb-6">
            <Globe className="w-8 h-8 text-blue-600" />
            <h1 className="text-3xl font-bold text-gray-800">Page Reader</h1>
          </div>
          
          <form onSubmit={handleSubmit} className="mb-6">
            <div className="flex gap-3">
              <div className="flex-1">
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  placeholder="Enter URL (e.g., https://example.com)"
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent transition-all duration-200"
                  disabled={loading}
                />
              </div>
              <button
                type="submit"
                disabled={loading || !url.trim()}
                className="px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all duration-200 flex items-center gap-2 font-medium"
              >
                {loading ? (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin" />
                    Loading...
                  </>
                ) : (
                  <>
                    <Globe className="w-5 h-5" />
                    Fetch Page
                  </>
                )}
              </button>
            </div>
          </form>

          {error && (
            <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-lg">
              <div className="flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-500 mt-0.5 flex-shrink-0" />
                <div>
                  <p className="text-red-800 font-medium">Error fetching page</p>
                  <p className="text-red-600 text-sm mt-1">{error}</p>
                </div>
              </div>
            </div>
          )}

          {htmlContent && (
            <div className="mb-6">
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-lg font-semibold text-gray-800">Fetched Content</h2>
                  <p className="text-sm text-gray-600">Source: {lastFetchedUrl}</p>
                </div>
                <button
                  onClick={downloadHtml}
                  className="flex items-center gap-2 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors duration-200"
                >
                  <Download className="w-4 h-4" />
                  Download HTML
                </button>
              </div>
            </div>
          )}
        </div>

        {htmlContent && (
          <div className="bg-white rounded-xl shadow-lg p-6">
            <div className="mb-4">
              <h3 className="text-lg font-semibold text-gray-800 mb-2">Static Page Preview</h3>
              <p className="text-sm text-gray-600">
                This is a static snapshot of the page content. Interactive elements may not work.
              </p>
            </div>
            
            <div className="border-2 border-gray-200 rounded-lg overflow-hidden">
              <iframe
                srcDoc={htmlContent}
                className="w-full h-96 border-none"
                title="Page Preview"
                sandbox="allow-same-origin"
                style={{ minHeight: '600px' }}
              />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default PageReader;