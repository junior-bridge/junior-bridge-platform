FROM node:20-alpine
RUN npm install -g newman@6.2.1 newman-reporter-htmlextra@1.23.1
WORKDIR /repo
ENTRYPOINT ["newman"]