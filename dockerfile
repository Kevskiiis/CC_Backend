# Base image node: Newest version of tag.
FROM node:24-alpine3.21

# Set/Create root working directory:
WORKDIR /app

# Copy depedencies files & install dependencies:
COPY  package.json ./
RUN npm install

# Copy source files: 
COPY /src ./src

# Copy Util Files:
COPY /utils ./utils

# Change directory to source folder & start server:
WORKDIR /app/src
CMD ["node", "server.js"]