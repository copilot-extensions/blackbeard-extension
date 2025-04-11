import pino from "pino";

// Create a pino logger instance
const logger = pino({
    level: process.env.LOG_LEVEL || "info", // Use LOG_LEVEL from environment or default to "info"

    transport: {
        targets: [
            {
                target: "pino-pretty", 
                options: { colorize: true },
            },
        ],
    },
});


// Helper function to format debug output
const formatDebug = (label, value) => {
    const labelWidth = 30; // Adjust the width as needed
    return label.padEnd(labelWidth, ' ') + ": " + value;
};

// Export the logger and the formatDebug function
export { logger, formatDebug };
