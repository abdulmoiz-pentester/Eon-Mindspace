import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { 
  CheckCircle, 
  XCircle, 
  AlertCircle, 
  Loader2, 
  User,
  Shield,
  Key,
  Cookie,
  RefreshCw
} from "lucide-react";

const TestAuth = () => {
  const [loading, setLoading] = useState(false);
  const [results, setResults] = useState<any>({});
  const [userInfo, setUserInfo] = useState<any>(null);
  const [cookies, setCookies] = useState<string>('');

  // Read user_info cookie
  const readUserCookie = () => {
    const cookie = document.cookie
      .split('; ')
      .find(row => row.startsWith('user_info='));
    
    if (cookie) {
      try {
        const value = cookie.split('=')[1];
        return JSON.parse(decodeURIComponent(value));
      } catch (e) {
        console.error('Failed to parse user cookie:', e);
        return null;
      }
    }
    return null;
  };

  // Test 1: Check backend health
  const testHealth = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/auth/health`);
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Test 2: Check authentication status
  const testAuthCheck = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/auth/check`, {
        credentials: 'include'
      });
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Test 3: Get current session
  const testSession = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/auth/session`, {
        credentials: 'include'
      });
      
      if (response.status === 401) {
        return { success: false, error: 'Not authenticated (401)' };
      }
      
      const data = await response.json();
      return { success: true, data };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Test 4: Test SAML metadata
  const testMetadata = async () => {
    try {
      const response = await fetch(`${process.env.REACT_APP_BACKEND_URL}/auth/metadata`);
      const text = await response.text();
      const isXML = text.includes('<?xml') || text.includes('EntityDescriptor');
      return { 
        success: true, 
        isXML, 
        length: text.length,
        preview: text.substring(0, 200) + '...'
      };
    } catch (error) {
      return { success: false, error: error.message };
    }
  };

  // Run all tests
  const runAllTests = async () => {
    setLoading(true);
    setUserInfo(readUserCookie());
    setCookies(document.cookie);

    const testResults = {
      health: await testHealth(),
      authCheck: await testAuthCheck(),
      session: await testSession(),
      metadata: await testMetadata(),
      timestamp: new Date().toISOString()
    };

    setResults(testResults);
    setLoading(false);
    
    // Update user info after tests
    setUserInfo(readUserCookie());
  };

  // Clear everything and logout
  const clearAndLogout = async () => {
    try {
      await fetch(`${process.env.REACT_APP_BACKEND_URL}/auth/logout`, {
        method: 'POST',
        credentials: 'include'
      });
      
      // Clear all cookies manually
      document.cookie.split(";").forEach(c => {
        document.cookie = c
          .replace(/^ +/, "")
          .replace(/=.*/, `=;expires=${new Date().toUTCString()};path=/`);
      });
      
      setUserInfo(null);
      setCookies('');
      setResults({});
      alert('Logged out and cookies cleared!');
    } catch (error) {
      console.error('Logout failed:', error);
    }
  };

  // Run tests on component mount
  useEffect(() => {
    runAllTests();
  }, []);

  // Test SAML Login directly
  const testSamlLogin = () => {
    const returnTo = encodeURIComponent('/test-auth');
    window.open(`${process.env.REACT_APP_BACKEND_URL}/auth/login?returnTo=${returnTo}`, '_blank');
  };

  // Test Dev Login
  const testDevLogin = () => {
    window.open(`${process.env.REACT_APP_BACKEND_URL}/auth/dev/login?email=testuser@eonhealth.com&name=Test%20User`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 p-4 md:p-8">
      <div className="max-w-6xl mx-auto">
        <Card className="mb-8">
          <CardHeader className="bg-gradient-to-r from-blue-600 to-blue-800 text-white rounded-t-lg">
            <CardTitle className="flex items-center gap-3">
              <Shield className="h-8 w-8" />
              <div>
                <h1 className="text-2xl font-bold">SAML Authentication Tester</h1>
                <p className="text-blue-100 text-sm font-normal">
                  Test your Keycloak SAML integration
                </p>
              </div>
            </CardTitle>
          </CardHeader>
          
          <CardContent className="pt-6">
            {/* User Info Section */}
            <div className="mb-8 p-4 bg-gradient-to-r from-green-50 to-blue-50 rounded-lg border border-green-200">
              <h3 className="text-lg font-semibold mb-3 flex items-center gap-2">
                <User className="h-5 w-5" />
                Current User Status
              </h3>
              
              {userInfo ? (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <div className="flex items-center gap-2 text-green-600">
                      <CheckCircle className="h-5 w-5" />
                      <span className="font-medium">Authenticated</span>
                    </div>
                    <div className="pl-7 space-y-1 text-sm">
                      <p><span className="font-medium">Email:</span> {userInfo.email}</p>
                      <p><span className="font-medium">Name:</span> {userInfo.name}</p>
                      <p><span className="font-medium">Company:</span> {userInfo.company}</p>
                    </div>
                  </div>
                  
                  <div className="text-sm">
                    <div className="flex items-center gap-2 mb-2">
                      <Cookie className="h-4 w-4" />
                      <span className="font-medium">Cookies Found:</span>
                    </div>
                    <pre className="bg-white p-2 rounded text-xs overflow-auto">
                      {cookies || 'No cookies found'}
                    </pre>
                  </div>
                </div>
              ) : (
                <div className="flex items-center gap-3 text-amber-600">
                  <AlertCircle className="h-5 w-5" />
                  <div>
                    <p className="font-medium">Not Authenticated</p>
                    <p className="text-sm">No user information found in cookies</p>
                  </div>
                </div>
              )}
            </div>

            {/* Test Results Section */}
            <div className="mb-8">
              <h3 className="text-lg font-semibold mb-4 flex items-center gap-2">
                <Key className="h-5 w-5" />
                Test Results
              </h3>
              
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Health Test */}
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Backend Health</span>
                      {results.health?.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    {results.health && (
                      <div className="text-sm">
                        <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto">
                          {JSON.stringify(results.health.data || results.health.error, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Auth Check Test */}
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Auth Check</span>
                      {results.authCheck?.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    {results.authCheck && (
                      <div className="text-sm">
                        <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto">
                          {JSON.stringify(results.authCheck.data || results.authCheck.error, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Session Test */}
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">Session Data</span>
                      {results.session?.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    {results.session && (
                      <div className="text-sm">
                        <pre className="bg-gray-50 p-2 rounded text-xs overflow-auto">
                          {JSON.stringify(results.session.data || results.session.error, null, 2)}
                        </pre>
                      </div>
                    )}
                  </CardContent>
                </Card>

                {/* Metadata Test */}
                <Card>
                  <CardContent className="pt-4">
                    <div className="flex items-center justify-between mb-2">
                      <span className="font-medium">SAML Metadata</span>
                      {results.metadata?.success ? (
                        <CheckCircle className="h-5 w-5 text-green-500" />
                      ) : (
                        <XCircle className="h-5 w-5 text-red-500" />
                      )}
                    </div>
                    {results.metadata && (
                      <div className="text-sm">
                        <div className="bg-gray-50 p-2 rounded text-xs overflow-auto">
                          {results.metadata.success ? (
                            <>
                              <p className="text-green-600">✓ Valid XML Metadata</p>
                              <p>Length: {results.metadata.length} chars</p>
                              <p className="mt-2 font-medium">Preview:</p>
                              <code>{results.metadata.preview}</code>
                            </>
                          ) : (
                            <p className="text-red-600">{results.metadata.error}</p>
                          )}
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex flex-wrap gap-4">
              <Button 
                onClick={runAllTests}
                disabled={loading}
                className="flex items-center gap-2"
              >
                {loading ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : (
                  <RefreshCw className="h-4 w-4" />
                )}
                Run All Tests
              </Button>

              <Button 
                onClick={testSamlLogin}
                variant="default"
                className="bg-blue-600 hover:bg-blue-700 flex items-center gap-2"
              >
                <Shield className="h-4 w-4" />
                Test SAML Login (Opens Keycloak)
              </Button>

              <Button 
                onClick={testDevLogin}
                variant="outline"
                className="flex items-center gap-2"
              >
                <User className="h-4 w-4" />
                Test Dev Login
              </Button>

              <Button 
                onClick={clearAndLogout}
                variant="destructive"
                className="flex items-center gap-2"
              >
                <XCircle className="h-4 w-4" />
                Clear & Logout
              </Button>
            </div>

            {/* Test Instructions */}
            <div className="mt-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <h4 className="font-semibold mb-2 text-blue-800">How to Test SAML Authentication:</h4>
              <ol className="list-decimal pl-5 space-y-2 text-sm text-blue-700">
                <li>Click "Test SAML Login" - This will open Keycloak in a new tab</li>
                <li>Login with your Keycloak credentials</li>
                <li>After login, Keycloak will redirect back</li>
                <li>Come back here and click "Run All Tests"</li>
                <li>You should see:
                  <ul className="list-disc pl-5 mt-1">
                    <li>User information in "Current User Status"</li>
                    <li>Auth Check showing "authenticated: true"</li>
                    <li>Session data with user details</li>
                  </ul>
                </li>
              </ol>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
};

export default TestAuth;
