// Supabase Edge Function for Code Execution
// Using Judge0 API to execute code

import { corsHeaders } from "../_shared/cors.ts"

// Language mappings
const languageMap: { [key: string]: number } = {
  python: 71,    // Python 3.8.1
  javascript: 63, // JavaScript Node.js 12.14.0
  typescript: 74, // TypeScript 3.7.4
  java: 62,      // Java 13.0.1
  cpp: 54,       // C++ GCC 9.2.0
  csharp: 51,    // C# Mono 6.6.0.161
  go: 60,        // Go 1.13.5
  ruby: 72,      // Ruby 2.7.0
};

// Helper to safely decode Base64
function safeDecode(encoded: string | null | undefined): string {
  if (!encoded) return "";
  try {
    return atob(encoded);
  } catch (e) {
    console.warn("Failed to decode base64 string:", encoded);
    return encoded || "";
  }
}

// Function to call Judge0 API
async function executeOnJudge0(apiKey: string, sourceCode: string, languageId: number) { 
  const rapidApiHost = "judge0-ce.p.rapidapi.com";
  const judge0AuthToken = Deno.env.get('JUDGE0_AUTH_TOKEN');
  const judge0AuthUser = Deno.env.get('JUDGE0_AUTH_USER');
  
  console.log("Starting Judge0 execution with:", {
    languageId,
    codeLength: sourceCode.length,
    hasAuthToken: !!judge0AuthToken,
    hasAuthUser: !!judge0AuthUser
  });

  // Log the exact code we're receiving
  console.log("Raw code received:", {
    length: sourceCode.length,
    code: sourceCode,
    lines: sourceCode.split('\n'),
  });
  
  // Create submission with EXACT code from editor
  const createUrl = `https://${rapidApiHost}/submissions?base64_encoded=true`;
  const body = JSON.stringify({
    source_code: btoa(sourceCode),  // Send exactly what we received
    language_id: languageId,
    stdin: "",
    expected_output: null,
    cpu_time_limit: 5,
    memory_limit: 128000,
    enable_network: false,
    wait: true  // Wait for result instead of using token
  });

  // Log what we're sending to Judge0
  console.log("Submitting to Judge0:", {
    language_id: languageId,
    code_length: sourceCode.length,
    code_preview: sourceCode.slice(0, 200) + (sourceCode.length > 200 ? '...' : '')
  });

  const headers: Record<string, string> = {
    "X-RapidAPI-Key": apiKey,
    "X-RapidAPI-Host": rapidApiHost,
    "Content-Type": "application/json",
  };

  // Add Judge0 authentication and authorization tokens if available
  if (judge0AuthToken) {
    headers["X-Auth-Token"] = judge0AuthToken;
  }
  if (judge0AuthUser) {
    headers["X-Auth-User"] = judge0AuthUser;
  }

  console.log("Making request to Judge0 with headers:", headers);

  const createResponse = await fetch(createUrl, {
    method: "POST",
    headers,
    body: body,
  });

  console.log("Judge0 create response status:", createResponse.status);
  const createResponseText = await createResponse.text();
  console.log("Judge0 create response body:", createResponseText);

  if (!createResponse.ok) {
    throw new Error(`Judge0 API submission failed: ${createResponse.status} - ${createResponseText}`);
  }

  const { token } = JSON.parse(createResponseText);
  console.log("Received submission token:", token);
  
  // Then poll for results
  const getUrl = `https://${rapidApiHost}/submissions/${token}?base64_encoded=true`;
  let result;
  let attempts = 0;
  const maxAttempts = 10;
  
  while (attempts < maxAttempts) {
    const getResponse = await fetch(getUrl, {
      method: "GET",
      headers,
    });

    if (!getResponse.ok) {
      const errorBody = await getResponse.text();
      console.error("Judge0 API Error (get):", getResponse.status, errorBody);
      throw new Error(`Judge0 API get result failed: ${getResponse.statusText} - ${errorBody}`);
    }

    result = await getResponse.json();
    
    // Log raw response for debugging
    console.log("Raw Judge0 Response:", JSON.stringify(result, null, 2));
    
    // Decode base64 outputs for logging
    const decodedStdout = safeDecode(result?.stdout);
    const decodedStderr = safeDecode(result?.stderr);
    
    console.log("Judge0 Result Attempt", attempts + 1, ":", {
      status: result?.status?.id,
      status_description: result?.status?.description,
      stdout: decodedStdout,
      stderr: decodedStderr,
      finished: result?.status?.id !== 1 && result?.status?.id !== 2,  // 1=In Queue, 2=Processing
    });

    // If the submission is finished, break the loop
    if (result.status.id !== 1 && result.status.id !== 2) {
      break;
    }

    // Wait before next attempt
    await new Promise(resolve => setTimeout(resolve, 1000));
    attempts++;
  }

  if (!result || result.status.id === 1 || result.status.id === 2) {
    throw new Error("Code execution timed out");
  }

  // Decode all base64 outputs
  const decodedResult = {
    ...result,
    stdout: safeDecode(result.stdout),
    stderr: safeDecode(result.stderr),
    compile_output: safeDecode(result.compile_output),
    source_code: sourceCode // Add the source code to the result
  };

  // Add better debugging for syntax errors - often the error is buried in one of these fields
  if (result.status.id !== 3) { // If not "Accepted" status
    console.log("Execution error detected. Status:", result.status);
    console.log("Stdout:", decodedResult.stdout);
    console.log("Stderr:", decodedResult.stderr);
    console.log("Compile output:", decodedResult.compile_output);
  }

  console.log("Final decoded result:", decodedResult);
  return decodedResult;
}

// Main handler
Deno.serve(async (req) => {
  // Handle CORS
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const { code, language } = await req.json()

    if (!code || !language) {
      throw new Error('Code and language are required')
    }

    const languageId = languageMap[language.toLowerCase()]
    if (!languageId) {
      throw new Error(`Unsupported language: ${language}`)
    }

    // Get API key from environment
    const apiKey = Deno.env.get('JUDGE0_API_KEY')
    if (!apiKey) {
      throw new Error('Judge0 API key not configured')
    }

    // Execute code
    const result = await executeOnJudge0(apiKey, code, languageId)

    // Return execution results with better logging
    const response = {
      stdout: result.stdout || '',
      stderr: result.stderr || '',
      compile_output: result.compile_output || '',
      time: result.time,
      memory: result.memory,
      status: result.status,
      code_sent: result.source_code?.slice(0, 500) + (result.source_code?.length > 500 ? '...' : '') // Include the code that was sent
    };

    console.log("Sending response:", response);

    return new Response(
      JSON.stringify(response),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )

  } catch (error) {
    console.error("Error in edge function:", error);
    return new Response(
      JSON.stringify({
        error: error.message,
      }),
      {
        status: 400,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    )
  }
}) 