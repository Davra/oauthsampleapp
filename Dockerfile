FROM node:8-alpine


COPY . /microservice

WORKDIR /microservice
RUN npm install

CMD ["sh", "start.sh"]

