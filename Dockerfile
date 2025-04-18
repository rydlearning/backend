FROM node:18
WORKDIR /app

# Copy source code
COPY . .

# Install dependencies
ARG SETUP_COMMAND="npm install"
RUN ${SETUP_COMMAND}

# Start the app
ARG START_COMMAND="npm run start"
RUN echo "${START_COMMAND}" > /app/entrypoint.sh
RUN chmod +x /app/entrypoint.sh

ENV PORT 80
EXPOSE 80

ENTRYPOINT ["sh", "-c", "/app/entrypoint.sh"]
