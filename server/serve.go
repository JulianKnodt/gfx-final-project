package main

import (
	"log"
	"net/http"
	"os"
)

func main() {
	shaders := http.FileServer(http.Dir("./shaders"))
	http.Handle("/shaders/", http.StripPrefix("/shaders/", shaders))
	resources := http.FileServer(http.Dir("./resources"))
	http.Handle("/resources/", http.StripPrefix("/resources/", resources))
	http.Handle("/", http.FileServer(http.Dir("./web")))

	// get Heroku port if available, otherwise use port 8000
	port := os.Getenv("PORT")
	if port == "" {
		port = "8000"
	}
	log.Println("Listening on :" + port + "...")
	if err := http.ListenAndServe(":"+port, nil); err != nil {
		log.Fatalf("Server crashed %s", err)
	}
}
