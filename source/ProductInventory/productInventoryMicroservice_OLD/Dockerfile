FROM node:16

# Create app directory
WORKDIR /usr/app

COPY package*.json ./

#RUN apk add --update nodejs npm

RUN npm install
# If you are building your code for production
# RUN npm ci --only=production

# Bundle app source
COPY . .

EXPOSE 8080

CMD ["node", "index.js"]