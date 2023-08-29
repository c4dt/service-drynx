FROM node:14-bullseye as build

WORKDIR /frontend
COPY . .
RUN make

FROM node:14-bullseye
COPY --from=build /frontend/webapp/dist /frontend
CMD python3 -m http.server 4200 --directory /frontend