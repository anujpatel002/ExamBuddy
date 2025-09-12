# Use official Node.js LTS image
FROM node:18-alpine

# Set working directory inside the container
WORKDIR /usr/src/app

# Copy package.json and package-lock.json first (for caching layer)
COPY package*.json ./

# Install dependencies (only production deps)
RUN npm install --production

# Copy the rest of the application files
COPY . .

# Expose port (Cloud Run will override, but good practice)
EXPOSE 8080

# Tell Cloud Run to use PORT env variable (default 8080)
ENV PORT=8080

# Start the app
CMD ["npm", "start"]
