const getUrl = (url) => {
    if (!url) return '';
    if (url.startsWith('http')) return url;
    return `https://${url}`;
};

const config = {
    backendUrl: getUrl(import.meta.env.VITE_BACKEND_URL) || 'http://localhost:5000',
    aiServiceUrl: getUrl(import.meta.env.VITE_AI_SERVICE_URL) || 'http://localhost:8000',
};

export default config;
