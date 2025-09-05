FROM python:3.11

# Set the working directory inside the container
WORKDIR /app

# Set an environment variable to prevent Python from writing .pyc files
ENV PYTHONDONTWRITEBYTECODE 1
# Ensure Python output is sent straight to the terminal without buffering
ENV PYTHONUNBUFFERED 1

# Copy requirements first to leverage Docker cache
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# This line is for building a standalone image.
# The volume mount in docker-compose will handle the code for development.
COPY ./src .