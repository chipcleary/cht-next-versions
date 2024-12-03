'use client';
import { useEffect, useState } from 'react';

function useEnvironmentData() {
  // Start with null to indicate loading
  const [envData, setEnvData] = useState(null);

  useEffect(() => {
    const isLocal = process.env.NODE_ENV === 'development';
    setEnvData({
      isLocal,
      version: process.env.APP_VERSION || 'local',
      nodeEnv: process.env.NODE_ENV || 'development',
      hello: process.env.HELLO || '',
      nextPublicHello: process.env.NEXT_PUBLIC_HELLO || '',
    });
  }, []);

  return envData;
}

export default function Home() {
  const envData = useEnvironmentData();

  // Show loading state until we have environment data
  if (!envData) {
    return <main className="p-8 max-w-3xl mx-auto">Loading...</main>;
  }

  return (
    <main className="p-8 max-w-3xl mx-auto">
      <h1 className="text-3xl font-bold">CHT Next Versions - Load Secret Example</h1>

      <div className="mt-8 space-y-4">
        <h2 className="text-2xl font-semibold">About This Example</h2>
        <p>This example shows how to load secrets using CHT Next Versions.</p>

        <p>
          When deployed to Google Cloud, it reads the Google Secret{' '}
          <code className="px-2 py-1 bg-gray-100 rounded">{'{APP_VERSION}_CONFIG'}</code> and writes
          the key-value pairs there into the environment.
        </p>
        <p>
          Keys starting with <code className="px-2 py-1 bg-gray-100 rounded">NEXT_PUBLIC</code> are
          written to the client-side (i.e., build) environment. Other keys are added to the
          server-side (i.e., runtime) environment.
        </p>

        <p>
          When running locally via{' '}
          <code className="px-2 py-1 bg-gray-100 rounded">npm run dev</code>, it reads{' '}
          <code>.env.development</code> and inserts all keys found there into the client
          environment.
        </p>

        <p>
          Keys starting with <code className="px-2 py-1 bg-gray-100 rounded">NEXT_PUBLIC</code> are
          written to the runtime environment. Other keys are added to the server environment.
        </p>

        <p>
          Note that while the secret is specific to the{' '}
          <code className="px-2 py-1 bg-gray-100 rounded">APP_VERSION</code>, the env var is always
          the same. This allows you to pull different config data in for different{' '}
          <code className="px-2 py-1 bg-gray-100 rounded">APP_VERSIONs</code>.
        </p>
      </div>

      <DeploymentInfo envData={envData} />

      <ConfigInfo envData={envData} />
    </main>
  );
}

function DeploymentInfo({ envData }) {
  return (
    <div className="mt-8">
      <h2 className="text-2xl font-semibold">Deployment Information</h2>{' '}
      <ul className="mt-4 space-y-2">
        <li>
          <strong>Version:</strong> {envData.version}
        </li>
        <li>
          <strong>Sanitized Version:</strong> {envData.version}
        </li>
        <li>
          <strong>Environment:</strong> {envData.nodeEnv}
        </li>
        <li>
          <strong>Runtime:</strong> {envData.isLocal ? 'Local' : 'Cloud Run'}
        </li>
      </ul>
    </div>
  );
}

function ConfigInfo({ envData }) {
  return (
    <div>
      {envData?.isLocal ? (
        <div className="mt-4 p-4 rounded-md bg-red-50">
          <p>
            👩‍💻 Running locally in development mode. Config data from{' '}
            <code className="px-2 py-1 bg-gray-100 rounded">.env.development</code> displayed.
          </p>
          <ConfigData envData={envData} />
        </div>
      ) : (
        <div className="mt-4 p-4 rounded-md bg-red-50">
          {' '}
          <p>
            {' '}
            👩‍💻 Not running locally. Config data from{' '}
            <code>APP_CONFIG_{envData.version.toUpperCase()}</code> displayed.{' '}
          </p>{' '}
          <ConfigData envData={envData} />{' '}
        </div>
      )}
    </div>
  );
}

function ConfigData({ envData }) {
  return (
    <ul className="mt-4 space-y-2">
      <li>
        <strong>NEXT_PUBLIC_HELLO:</strong> {envData.nextPublicHello}
      </li>
      <li>
        <strong>HELLO:</strong> {envData.hello}
      </li>
    </ul>
  );
}
