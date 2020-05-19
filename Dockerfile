# -----
FROM node:13.8-alpine AS build

RUN apk update
RUN apk add --no-cache bash file postgresql nano 
#ENV PYTHONUNBUFFERED=1
#RUN apk add --no-cache python3 && \
#    if [ ! -e /usr/bin/python ]; then ln -sf python3 /usr/bin/python ; fi 


WORKDIR /usr/src/dagviz
COPY . .
RUN npm install

#RUN mv /usr/src/dagviz/k-explorer /usr/src/dagviz/k-explorer
RUN cd /usr/src/dagviz/k-explorer && npm install && npm link
RUN npm link k-explorer

EXPOSE 8686 
EXPOSE 18686-20000

ENTRYPOINT ["node","dagviz.js"]
