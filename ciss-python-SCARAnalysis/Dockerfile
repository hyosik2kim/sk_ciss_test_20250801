# Use official Python 3.11 slim image
FROM python:3.11-slim

# Set working directory
WORKDIR /app

# Install dependencies
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# Copy application code
COPY . .

# Set environment variables for MongoDB
ENV MONGODB_URI="mongodb://localhost:27017" \
    MONGODB_DATABASE_NAME="ciss" \
    MONGODB_COLLECTION_NAME="monitoring_status"

# Expose application port
EXPOSE 5000

# Run the application
CMD ["python", "app/main.py"]