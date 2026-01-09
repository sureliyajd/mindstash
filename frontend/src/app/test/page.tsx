export default async function TestPage() {
    const response = await fetch('http://localhost:8001/health');
    const data = await response.json();
    
    return (
      <div>
        <h1>API Test</h1>
        <pre>{JSON.stringify(data, null, 2)}</pre>
      </div>
    );
  }