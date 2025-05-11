const API_CONFIG = {
    BASE_URL: process.env.REACT_APP_API_BASE_URL || 'http://localhost:8080',
    ENDPOINTS: {
        GENERATE_SCRIPT: '/generate-script',
        REGENERATE_PARAGRAPH: '/regenerate-paragraph',
        REGENERATE_SEGMENT: '/regenerate-segment',
    },
};
console.log(API_CONFIG);
export default API_CONFIG; 