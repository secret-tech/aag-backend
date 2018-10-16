FROM node:8.12-alpine
EXPOSE 3000 9229
COPY . /home/app
WORKDIR /home/app
RUN npm install
CMD ./scripts/start.sh