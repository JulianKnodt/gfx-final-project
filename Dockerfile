### Build binary from official Go image
FROM golang:latest as build
COPY . /app
WORKDIR /app/server
RUN CGO_ENABLED=0 GOOS=linux GOARCH=amd64 go build -ldflags "-w" -a -o /main .

### Put the static files and binary onto Alpine image
FROM alpine:latest
COPY ./resources ./resources
COPY ./shaders ./shaders
COPY ./web ./web
COPY --from=build /main ./
RUN chmod +x ./main
CMD ./main
