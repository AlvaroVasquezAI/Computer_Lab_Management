FROM node:20-alpine

# Set the working directory inside the container
WORKDIR /app

# Copy the package.json file first. This is a key Docker optimization.
# The 'npm install' step will only be re-run if this file changes.
COPY package*.json ./

# Install project dependencies. This will also create package-lock.json inside the container.
RUN npm install

# Copy the rest of our frontend application code into the container
COPY . .

# Expose the port the Vite development server runs on
EXPOSE 5173

# The command to start the app is specified in docker-compose.yml