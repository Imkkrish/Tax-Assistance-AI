
const config = {
    backendUrl: import.meta.env.VITE_BACKEND_URL || 'http://localhost:5000',
    aiServiceUrl: import.meta.env.VITE_AI_SERVICE_URL || 'http://localhost:8000',
};

export default config;
