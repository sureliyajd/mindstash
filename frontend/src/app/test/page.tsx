// Force dynamic rendering to avoid prerender errors during build
export const dynamic = 'force-dynamic';

export default async function TestPage() {
    try {
      const response = await fetch('http://localhost:8001/health');
      const data = await response.json();

      return (
        <div>
          <h1>API Test</h1>
          <pre>{JSON.stringify(data, null, 2)}</pre>
        </div>
      );
    } catch (error) {
      return (
        <div>
          <h1>API Test</h1>
          <p>Error: Backend not available</p>
        </div>
      );
    }
  }